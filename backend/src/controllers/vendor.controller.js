import { query } from "../config/db.js";

export async function createVendor(req, res, next) {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      serviceCategory,
      taxId,
      bankName,
      accountName,
      accountNumber
    } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ message: "Company name and email are required" });
    }

    const result = await query(
      `INSERT INTO vendors (
        company_name, contact_person, email, phone, address, service_category,
        tax_id, bank_name, account_name, account_number, status
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
       RETURNING *`,
      [
        companyName,
        contactPerson || null,
        email.toLowerCase(),
        phone || null,
        address || null,
        serviceCategory || null,
        taxId || null,
        bankName || null,
        accountName || null,
        accountNumber || null
      ]
    );

    res.status(201).json({ vendor: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Vendor email already exists" });
    }
    next(error);
  }
}

export async function getVendors(req, res, next) {
  try {
    const result = await query("SELECT * FROM vendors ORDER BY created_at DESC");
    res.json({ vendors: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getVendorById(req, res, next) {
  try {
    const result = await query("SELECT * FROM vendors WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateVendorStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["pending", "active", "inactive", "blacklisted"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid vendor status" });
    }

    const result = await query(
      `UPDATE vendors
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
