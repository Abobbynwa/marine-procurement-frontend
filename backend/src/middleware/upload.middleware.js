import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  }
});

function fileFilter(req, file, cb) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"), false);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export function getPublicFileUrl(filename) {
  return `/uploads/${path.basename(filename)}`;
}
