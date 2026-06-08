import { Router } from "express";
import { getDashboardReport } from "../controllers/report.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/dashboard", requireAuth, allowRoles("admin", "procurement", "approver", "finance"), getDashboardReport);

export default router;
