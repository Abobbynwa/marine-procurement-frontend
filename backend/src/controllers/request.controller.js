import { query } from "../config/db.js";

function generateRequestNo() {
  return `PR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function createPurchaseRequest(req, res, next) {
  try {
    const {
      title,
      category,
      vesselOrDepartment,
      priority = "medium",
      requiredDate,
      estimatedBudget = 0,
      description,
      items = []
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    const requestResult = await query(
      `INSERT INTO purchase_requests (
        request_no, requester_id, title, category, vessel_or_department,
        priority, required_date, estimated_budget, description, status
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'submitted')
       RETURNING *`,
      [
        generateRequestNo(),
        req.user.id,
        title,
        category,
        vesselOrDepartment || null,
        priority,
        requiredDate || null,
        estimatedBudget,
        description || null
      ]
    );

    const request = requestResult.rows[0];

    for (const item of items) {
      if (!item.itemName) continue;
      await query(
        `INSERT INTO request_items (request_id, item_name, quantity, unit, estimated_unit_price, description)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          request.id,
          item.itemName,
          item.quantity || 1,
          item.unit || null,
          item.estimatedUnitPrice || 0,
          item.description || null
        ]
      );
    }

    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseRequests(req, res, next) {
  try {
    let sql = `
      SELECT pr.*, u.full_name AS requester_name
      FROM purchase_requests pr
      LEFT JOIN users u ON u.id = pr.requester_id
    `;
    const params = [];

    if (req.user.role === "requester") {
      sql += " WHERE pr.requester_id = $1";
      params.push(req.user.id);
    }

    sql += " ORDER BY pr.created_at DESC";

    const result = await query(sql, params);
    res.json({ requests: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseRequestById(req, res, next) {
  try {
    const result = await query(
      `SELECT pr.*, u.full_name AS requester_name
       FROM purchase_requests pr
       LEFT JOIN users u ON u.id = pr.requester_id
       WHERE pr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    const itemResult = await query("SELECT * FROM request_items WHERE request_id = $1", [req.params.id]);

    res.json({ request: result.rows[0], items: itemResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function approvePurchaseRequest(req, res, next) {
  try {
    const { decision, comment } = req.body;
    const allowed = ["approved", "rejected", "correction_requested"];

    if (!allowed.includes(decision)) {
      return res.status(400).json({ message: "Invalid approval decision" });
    }

    await query(
      `INSERT INTO approvals (request_id, approver_id, decision, comment)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, req.user.id, decision, comment || null]
    );

    const result = await query(
      `UPDATE purchase_requests
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [decision, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
