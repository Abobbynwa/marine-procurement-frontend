import { query } from "../config/db.js";

export async function getUsers(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, department, phone, status, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, department, phone, status, created_at
       FROM users
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["active", "inactive", "suspended"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await query(
      `UPDATE users
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, role, department, phone, status, updated_at`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
