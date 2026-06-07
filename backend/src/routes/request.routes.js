import { Router } from "express";
import { approvePurchaseRequest, createPurchaseRequest, getPurchaseRequestById, getPurchaseRequests } from "../controllers/request.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "requester", "procurement"), createPurchaseRequest);
router.get("/", requireAuth, getPurchaseRequests);
router.get("/:id", requireAuth, getPurchaseRequestById);
router.post("/:id/approval", requireAuth, allowRoles("admin", "approver", "finance"), approvePurchaseRequest);

export default router;
