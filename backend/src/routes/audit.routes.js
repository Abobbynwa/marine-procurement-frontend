import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, allowRoles("admin", "procurement"), getAuditLogs);

export default router;
