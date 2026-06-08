import { query } from "../config/db.js";

export async function createDelivery(req, res, next) {
  try {
    const { poId, deliveryStatus = "pending", deliveryNoteUrl, comment, deliveredAt } = req.body;

    if (!poId) {
      return res.status(400).json({ message: "Purchase order ID is required" });
    }

    const poCheck = await query("SELECT id, request_id FROM purchase_orders WHERE id = $1", [poId]);
    if (poCheck.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const result = await query(
      `INSERT INTO deliveries (po_id, received_by, delivery_status, delivery_note_url, comment, delivered_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [poId, req.user.id, deliveryStatus, deliveryNoteUrl || null, comment || null, deliveredAt || null]
    );

    if (["partially_delivered", "delivered", "verified"].includes(deliveryStatus)) {
      await query(
        "UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2",
        [deliveryStatus === "partially_delivered" ? "partially_delivered" : "delivered", poId]
      );

      if (deliveryStatus !== "partially_delivered") {
        await query(
          "UPDATE purchase_requests SET status = 'delivered', updated_at = NOW() WHERE id = $1",
          [poCheck.rows[0].request_id]
        );
      }
    }

    res.status(201).json({ delivery: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveries(req, res, next) {
  try {
    const result = await query(
      `SELECT d.*, po.po_no, po.total_amount, v.company_name, u.full_name AS received_by_name
       FROM deliveries d
       JOIN purchase_orders po ON po.id = d.po_id
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN users u ON u.id = d.received_by
       ORDER BY d.created_at DESC`
    );

    res.json({ deliveries: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryStatus(req, res, next) {
  try {
    const { deliveryStatus, comment } = req.body;
    const allowed = ["pending", "in_transit", "partially_delivered", "delivered", "verified"];

    if (!allowed.includes(deliveryStatus)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const result = await query(
      `UPDATE deliveries
       SET delivery_status = $1,
           comment = COALESCE($2, comment),
           delivered_at = CASE WHEN $1 IN ('delivered', 'verified') THEN NOW() ELSE delivered_at END
       WHERE id = $3
       RETURNING *`,
      [deliveryStatus, comment || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery record not found" });
    }

    const delivery = result.rows[0];

    if (["partially_delivered", "delivered", "verified"].includes(deliveryStatus)) {
      await query(
        "UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2",
        [deliveryStatus === "partially_delivered" ? "partially_delivered" : "delivered", delivery.po_id]
      );
    }

    res.json({ delivery });
  } catch (error) {
    next(error);
  }
}
