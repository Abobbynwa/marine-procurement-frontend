import { query } from "../config/db.js";

export async function getAuditLogs(req, res, next) {
  try {
    const result = await query(
      `SELECT al.*, u.full_name, u.email, u.role
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 200`
    );

    res.json({ auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
}
