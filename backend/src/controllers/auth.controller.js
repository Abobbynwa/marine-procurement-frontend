import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { signToken } from "../utils/token.js";

const allowedRoles = ["admin", "requester", "approver", "procurement", "vendor", "finance"];

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role = "requester", department, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, department, phone, status, created_at`,
      [fullName, email.toLowerCase(), passwordHash, role, department || null, phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await query(
      "SELECT id, full_name, email, password_hash, role, department, phone, status FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    delete user.password_hash;
    const token = signToken(user);

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
