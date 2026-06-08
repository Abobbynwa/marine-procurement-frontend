import { query } from "../config/db.js";

export async function createPayment(req, res, next) {
  try {
    const { invoiceId, amount, paymentReference, paymentStatus = "completed", paidAt } = req.body;

    if (!invoiceId || !amount) {
      return res.status(400).json({ message: "Invoice ID and amount are required" });
    }

    const invoiceCheck = await query(
      `SELECT i.id, i.po_id, po.request_id
       FROM invoices i
       JOIN purchase_orders po ON po.id = i.po_id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const result = await query(
      `INSERT INTO payments (invoice_id, amount, payment_reference, payment_status, paid_at)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [invoiceId, amount, paymentReference || null, paymentStatus, paidAt || new Date()]
    );

    if (paymentStatus === "completed") {
      await query("UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE id = $1", [invoiceId]);
      await query("UPDATE purchase_orders SET status = 'closed', updated_at = NOW() WHERE id = $1", [invoiceCheck.rows[0].po_id]);
      await query("UPDATE purchase_requests SET status = 'closed', updated_at = NOW() WHERE id = $1", [invoiceCheck.rows[0].request_id]);
    }

    res.status(201).json({ payment: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req, res, next) {
  try {
    const result = await query(
      `SELECT p.*, i.invoice_no, po.po_no, v.company_name
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN purchase_orders po ON po.id = i.po_id
       LEFT JOIN vendors v ON v.id = i.vendor_id
       ORDER BY p.created_at DESC`
    );

    res.json({ payments: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const { paymentStatus } = req.body;
    const allowed = ["pending", "completed", "failed"];

    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const result = await query(
      `UPDATE payments
       SET payment_status = $1,
           paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
       WHERE id = $2
       RETURNING *`,
      [paymentStatus, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ payment: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
