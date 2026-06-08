import { query } from "../config/db.js";

export async function createInvoice(req, res, next) {
  try {
    const { invoiceNo, poId, vendorId, amount, invoiceUrl, status = "received" } = req.body;

    if (!invoiceNo || !poId || !amount) {
      return res.status(400).json({ message: "Invoice number, PO ID and amount are required" });
    }

    const poCheck = await query("SELECT id, vendor_id, request_id FROM purchase_orders WHERE id = $1", [poId]);
    if (poCheck.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const finalVendorId = vendorId || poCheck.rows[0].vendor_id;

    const result = await query(
      `INSERT INTO invoices (invoice_no, po_id, vendor_id, amount, invoice_url, status)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [invoiceNo, poId, finalVendorId, amount, invoiceUrl || null, status]
    );

    await query("UPDATE purchase_requests SET status = 'invoiced', updated_at = NOW() WHERE id = $1", [poCheck.rows[0].request_id]);

    res.status(201).json({ invoice: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Invoice number already exists" });
    }
    next(error);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const result = await query(
      `SELECT i.*, po.po_no, v.company_name
       FROM invoices i
       JOIN purchase_orders po ON po.id = i.po_id
       LEFT JOIN vendors v ON v.id = i.vendor_id
       ORDER BY i.created_at DESC`
    );

    res.json({ invoices: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["received", "verified", "payment_pending", "paid", "rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid invoice status" });
    }

    const result = await query(
      `UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ invoice: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
