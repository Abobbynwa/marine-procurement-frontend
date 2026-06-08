import { Router } from "express";
import { createInvoice, getInvoices, updateInvoiceStatus } from "../controllers/invoice.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement", "finance"), createInvoice);
router.get("/", requireAuth, allowRoles("admin", "procurement", "finance", "approver"), getInvoices);
router.patch("/:id/status", requireAuth, allowRoles("admin", "finance"), updateInvoiceStatus);

export default router;
