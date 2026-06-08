import { query } from "../config/db.js";

export async function logAudit({ userId, action, entityType, entityId = null, metadata = {} }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId || null, action, entityType || null, entityId || null, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}
