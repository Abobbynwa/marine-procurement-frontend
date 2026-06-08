import { Router } from "express";
import { createDelivery, getDeliveries, updateDeliveryStatus } from "../controllers/delivery.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement", "finance"), createDelivery);
router.get("/", requireAuth, allowRoles("admin", "procurement", "finance", "approver"), getDeliveries);
router.patch("/:id/status", requireAuth, allowRoles("admin", "procurement", "finance"), updateDeliveryStatus);

export default router;
