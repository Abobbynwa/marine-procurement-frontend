import { Router } from "express";
import { createPayment, getPayments, updatePaymentStatus } from "../controllers/payment.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "finance"), createPayment);
router.get("/", requireAuth, allowRoles("admin", "finance", "approver"), getPayments);
router.patch("/:id/status", requireAuth, allowRoles("admin", "finance"), updatePaymentStatus);

export default router;
