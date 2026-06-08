import { Router } from "express";
import { getAdminConsole, updateRecordStatus, updateUserAdmin } from "../controllers/admin.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/console", requireAuth, allowRoles("admin"), getAdminConsole);
router.patch("/users/:id", requireAuth, allowRoles("admin"), updateUserAdmin);
router.patch("/:module/:id/status", requireAuth, allowRoles("admin"), updateRecordStatus);

export default router;
