import { Router } from "express";
import { createRfq, getRfqById, getRfqs, updateRfqStatus } from "../controllers/rfq.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement"), createRfq);
router.get("/", requireAuth, allowRoles("admin", "procurement", "approver", "finance", "vendor"), getRfqs);
router.get("/:id", requireAuth, allowRoles("admin", "procurement", "approver", "finance", "vendor"), getRfqById);
router.patch("/:id/status", requireAuth, allowRoles("admin", "procurement"), updateRfqStatus);

export default router;
