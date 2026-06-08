import { Router } from "express";
import { getUploadedFiles, uploadDocument } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/", requireAuth, upload.single("document"), uploadDocument);
router.get("/", requireAuth, getUploadedFiles);

export default router;
