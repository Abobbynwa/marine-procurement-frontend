import { query } from "../config/db.js";

function generateRfqNo() {
  return `RFQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function createRfq(req, res, next) {
  try {
    const { requestId, title, deadline, requirements, vendorIds = [] } = req.body;

    if (!requestId || !title || !deadline) {
      return res.status(400).json({ message: "Request ID, title and deadline are required" });
    }

    const requestCheck = await query("SELECT id, status FROM purchase_requests WHERE id = $1", [requestId]);
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    const rfqResult = await query(
      `INSERT INTO rfqs (rfq_no, request_id, title, deadline, requirements, status, created_by)
       VALUES ($1,$2,$3,$4,$5,'open',$6)
       RETURNING *`,
      [generateRfqNo(), requestId, title, deadline, requirements || null, req.user.id]
    );

    const rfq = rfqResult.rows[0];

    for (const vendorId of vendorIds) {
      await query(
        `INSERT INTO rfq_vendors (rfq_id, vendor_id)
         VALUES ($1,$2)
         ON CONFLICT (rfq_id, vendor_id) DO NOTHING`,
        [rfq.id, vendorId]
      );
    }

    await query(
      "UPDATE purchase_requests SET status = 'rfq_created', updated_at = NOW() WHERE id = $1",
      [requestId]
    );

    res.status(201).json({ rfq });
  } catch (error) {
    next(error);
  }
}

export async function getRfqs(req, res, next) {
  try {
    const result = await query(
      `SELECT r.*, pr.request_no, pr.title AS request_title, u.full_name AS created_by_name,
        COUNT(rv.vendor_id)::int AS invited_vendors
       FROM rfqs r
       LEFT JOIN purchase_requests pr ON pr.id = r.request_id
       LEFT JOIN users u ON u.id = r.created_by
       LEFT JOIN rfq_vendors rv ON rv.rfq_id = r.id
       GROUP BY r.id, pr.request_no, pr.title, u.full_name
       ORDER BY r.created_at DESC`
    );

    res.json({ rfqs: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getRfqById(req, res, next) {
  try {
    const rfqResult = await query(
      `SELECT r.*, pr.request_no, pr.title AS request_title
       FROM rfqs r
       LEFT JOIN purchase_requests pr ON pr.id = r.request_id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (rfqResult.rows.length === 0) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const vendorsResult = await query(
      `SELECT v.*
       FROM rfq_vendors rv
       JOIN vendors v ON v.id = rv.vendor_id
       WHERE rv.rfq_id = $1
       ORDER BY rv.invited_at DESC`,
      [req.params.id]
    );

    const quotesResult = await query(
      `SELECT q.*, v.company_name
       FROM quotations q
       JOIN vendors v ON v.id = q.vendor_id
       WHERE q.rfq_id = $1
       ORDER BY q.total_amount ASC`,
      [req.params.id]
    );

    res.json({ rfq: rfqResult.rows[0], vendors: vendorsResult.rows, quotations: quotesResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function updateRfqStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["draft", "open", "closed", "awarded", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid RFQ status" });
    }

    const result = await query(
      `UPDATE rfqs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    res.json({ rfq: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
