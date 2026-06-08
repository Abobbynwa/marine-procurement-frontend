import { query } from "../config/db.js";
import { getPublicFileUrl } from "../middleware/upload.middleware.js";
import { isS3Enabled, uploadFileToS3 } from "../utils/s3.js";

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { entityType, entityId } = req.body;
    let storedName = req.file.filename;
    let fileUrl = getPublicFileUrl(req.file.filename);

    if (isS3Enabled()) {
      const uploaded = await uploadFileToS3(req.file);
      storedName = uploaded.storedName;
      fileUrl = uploaded.fileUrl;
    }

    const result = await query(
      `INSERT INTO uploaded_files (
        original_name, stored_name, file_url, mime_type, size_bytes,
        entity_type, entity_id, uploaded_by
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.file.originalname,
        storedName,
        fileUrl,
        req.file.mimetype,
        req.file.size,
        entityType || null,
        entityId || null,
        req.user.id
      ]
    );

    res.status(201).json({ file: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function getUploadedFiles(req, res, next) {
  try {
    const { entityType, entityId } = req.query;
    const params = [];
    let where = "";

    if (entityType && entityId) {
      where = "WHERE entity_type = $1 AND entity_id = $2";
      params.push(entityType, entityId);
    }

    const result = await query(
      `SELECT uf.*, u.full_name AS uploaded_by_name
       FROM uploaded_files uf
       LEFT JOIN users u ON u.id = uf.uploaded_by
       ${where}
       ORDER BY uf.created_at DESC`,
      params
    );

    res.json({ files: result.rows });
  } catch (error) {
    next(error);
  }
}
