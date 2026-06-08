import { Router } from "express";
import { createQuotation, getQuotationById, getQuotations, updateQuotationStatus } from "../controllers/quotation.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement", "vendor"), createQuotation);
router.get("/", requireAuth, allowRoles("admin", "procurement", "approver", "finance"), getQuotations);
router.get("/:id", requireAuth, allowRoles("admin", "procurement", "approver", "finance", "vendor"), getQuotationById);
router.patch("/:id/status", requireAuth, allowRoles("admin", "procurement"), updateQuotationStatus);

export default router;
