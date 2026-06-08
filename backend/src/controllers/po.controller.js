import { query } from "../config/db.js";

function generatePoNo() {
  return `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function createPurchaseOrder(req, res, next) {
  try {
    const { quotationId, deliveryAddress, deliveryDeadline, approvedBy } = req.body;

    if (!quotationId) {
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    const quoteResult = await query(
      `SELECT q.*, r.request_id
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE q.id = $1`,
      [quotationId]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const quote = quoteResult.rows[0];

    const poResult = await query(
      `INSERT INTO purchase_orders (
        po_no, request_id, quotation_id, vendor_id, total_amount,
        delivery_address, delivery_deadline, status, created_by, approved_by
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'issued',$8,$9)
       RETURNING *`,
      [
        generatePoNo(),
        quote.request_id,
        quote.id,
        quote.vendor_id,
        quote.total_amount,
        deliveryAddress || null,
        deliveryDeadline || null,
        req.user.id,
        approvedBy || req.user.id
      ]
    );

    const po = poResult.rows[0];

    const itemsResult = await query("SELECT * FROM quotation_items WHERE quotation_id = $1", [quotationId]);
    for (const item of itemsResult.rows) {
      await query(
        `INSERT INTO po_items (po_id, item_name, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [po.id, item.item_name, item.quantity, item.unit_price, item.total_price]
      );
    }

    await query("UPDATE quotations SET status = 'accepted', updated_at = NOW() WHERE id = $1", [quotationId]);
    await query("UPDATE rfqs SET status = 'awarded', updated_at = NOW() WHERE id = $1", [quote.rfq_id]);
    await query("UPDATE purchase_requests SET status = 'po_issued', updated_at = NOW() WHERE id = $1", [quote.request_id]);

    res.status(201).json({ purchaseOrder: po });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrders(req, res, next) {
  try {
    const result = await query(
      `SELECT po.*, v.company_name, pr.request_no, q.quotation_no
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_requests pr ON pr.id = po.request_id
       LEFT JOIN quotations q ON q.id = po.quotation_id
       ORDER BY po.created_at DESC`
    );

    res.json({ purchaseOrders: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderById(req, res, next) {
  try {
    const poResult = await query(
      `SELECT po.*, v.company_name, v.email AS vendor_email, pr.request_no, q.quotation_no
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_requests pr ON pr.id = po.request_id
       LEFT JOIN quotations q ON q.id = po.quotation_id
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const itemsResult = await query("SELECT * FROM po_items WHERE po_id = $1", [req.params.id]);

    res.json({ purchaseOrder: poResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["draft", "issued", "pending_delivery", "partially_delivered", "delivered", "closed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid purchase order status" });
    }

    const result = await query(
      `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({ purchaseOrder: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
