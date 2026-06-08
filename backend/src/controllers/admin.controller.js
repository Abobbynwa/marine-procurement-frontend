import { query } from "../config/db.js";

export async function getAdminConsole(req, res, next) {
  try {
    const [users, vendors, requests, rfqs, quotations, purchaseOrders, deliveries, invoices, payments, files, auditLogs] = await Promise.all([
      query("SELECT id, full_name, email, role, department, phone, status, created_at FROM users ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM vendors ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM purchase_requests ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM rfqs ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM quotations ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM purchase_orders ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM payments ORDER BY created_at DESC LIMIT 50"),
      query("SELECT * FROM uploaded_files ORDER BY created_at DESC LIMIT 50"),
      query(`SELECT al.*, u.full_name, u.email, u.role FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 50`)
    ]);

    res.json({
      users: users.rows,
      vendors: vendors.rows,
      requests: requests.rows,
      rfqs: rfqs.rows,
      quotations: quotations.rows,
      purchaseOrders: purchaseOrders.rows,
      deliveries: deliveries.rows,
      invoices: invoices.rows,
      payments: payments.rows,
      files: files.rows,
      auditLogs: auditLogs.rows,
      totals: {
        users: users.rows.length,
        vendors: vendors.rows.length,
        requests: requests.rows.length,
        rfqs: rfqs.rows.length,
        quotations: quotations.rows.length,
        purchaseOrders: purchaseOrders.rows.length,
        deliveries: deliveries.rows.length,
        invoices: invoices.rows.length,
        payments: payments.rows.length,
        files: files.rows.length,
        auditLogs: auditLogs.rows.length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserAdmin(req, res, next) {
  try {
    const { role, status } = req.body;
    const allowedRoles = ["admin", "requester", "approver", "procurement", "vendor", "finance"];
    const allowedStatuses = ["active", "inactive", "suspended"];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const current = await query("SELECT role, status FROM users WHERE id = $1", [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await query(
      `UPDATE users
       SET role = COALESCE($1, role),
           status = COALESCE($2, status),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, full_name, email, role, department, phone, status, created_at, updated_at`,
      [role || null, status || null, req.params.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateRecordStatus(req, res, next) {
  try {
    const { module, id } = req.params;
    const { status } = req.body;

    const moduleMap = {
      vendors: { table: "vendors", column: "status", allowed: ["pending", "active", "inactive", "blacklisted"] },
      requests: { table: "purchase_requests", column: "status", allowed: ["draft", "submitted", "pending_approval", "approved", "rejected", "correction_requested", "rfq_created", "vendor_selected", "po_issued", "delivered", "invoiced", "closed"] },
      rfqs: { table: "rfqs", column: "status", allowed: ["draft", "open", "closed", "awarded", "cancelled"] },
      quotations: { table: "quotations", column: "status", allowed: ["submitted", "under_review", "recommended", "accepted", "rejected"] },
      purchaseOrders: { table: "purchase_orders", column: "status", allowed: ["draft", "issued", "pending_delivery", "partially_delivered", "delivered", "closed", "cancelled"] },
      deliveries: { table: "deliveries", column: "delivery_status", allowed: ["pending", "in_transit", "partially_delivered", "delivered", "verified"] },
      invoices: { table: "invoices", column: "status", allowed: ["received", "verified", "payment_pending", "paid", "rejected"] },
      payments: { table: "payments", column: "payment_status", allowed: ["pending", "completed", "failed"] }
    };

    const config = moduleMap[module];
    if (!config) {
      return res.status(400).json({ message: "Unsupported module" });
    }

    if (!config.allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status for this module" });
    }

    const result = await query(
      `UPDATE ${config.table} SET ${config.column} = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ record: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
