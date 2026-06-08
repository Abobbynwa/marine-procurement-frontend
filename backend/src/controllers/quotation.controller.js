import { query } from "../config/db.js";

function generateQuotationNo() {
  return `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function createQuotation(req, res, next) {
  try {
    const {
      rfqId,
      vendorId,
      totalAmount = 0,
      deliveryTime,
      validityPeriod,
      paymentTerms,
      warranty,
      notes,
      items = []
    } = req.body;

    if (!rfqId || !vendorId) {
      return res.status(400).json({ message: "RFQ ID and vendor ID are required" });
    }

    const quotationResult = await query(
      `INSERT INTO quotations (
        quotation_no, rfq_id, vendor_id, total_amount, delivery_time,
        validity_period, payment_terms, warranty, notes, status
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'submitted')
       RETURNING *`,
      [
        generateQuotationNo(),
        rfqId,
        vendorId,
        totalAmount,
        deliveryTime || null,
        validityPeriod || null,
        paymentTerms || null,
        warranty || null,
        notes || null
      ]
    );

    const quotation = quotationResult.rows[0];

    for (const item of items) {
      if (!item.itemName) continue;
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      await query(
        `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [quotation.id, item.itemName, quantity, unitPrice, quantity * unitPrice]
      );
    }

    res.status(201).json({ quotation });
  } catch (error) {
    next(error);
  }
}

export async function getQuotations(req, res, next) {
  try {
    const result = await query(
      `SELECT q.*, r.rfq_no, r.title AS rfq_title, v.company_name
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       JOIN vendors v ON v.id = q.vendor_id
       ORDER BY q.created_at DESC`
    );

    res.json({ quotations: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getQuotationById(req, res, next) {
  try {
    const quoteResult = await query(
      `SELECT q.*, r.rfq_no, r.title AS rfq_title, v.company_name
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       JOIN vendors v ON v.id = q.vendor_id
       WHERE q.id = $1`,
      [req.params.id]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const itemsResult = await query("SELECT * FROM quotation_items WHERE quotation_id = $1", [req.params.id]);

    res.json({ quotation: quoteResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function updateQuotationStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["submitted", "under_review", "recommended", "accepted", "rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid quotation status" });
    }

    const result = await query(
      `UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json({ quotation: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
