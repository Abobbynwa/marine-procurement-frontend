import { Router } from "express";
import { createPurchaseOrder, getPurchaseOrderById, getPurchaseOrders, updatePurchaseOrderStatus } from "../controllers/po.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement"), createPurchaseOrder);
router.get("/", requireAuth, allowRoles("admin", "procurement", "approver", "finance"), getPurchaseOrders);
router.get("/:id", requireAuth, allowRoles("admin", "procurement", "approver", "finance"), getPurchaseOrderById);
router.patch("/:id/status", requireAuth, allowRoles("admin", "procurement", "finance"), updatePurchaseOrderStatus);

export default router;
