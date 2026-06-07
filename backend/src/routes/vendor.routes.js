import { Router } from "express";
import { createVendor, getVendorById, getVendors, updateVendorStatus } from "../controllers/vendor.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, allowRoles("admin", "procurement"), createVendor);
router.get("/", requireAuth, allowRoles("admin", "procurement", "finance"), getVendors);
router.get("/:id", requireAuth, allowRoles("admin", "procurement", "finance"), getVendorById);
router.patch("/:id/status", requireAuth, allowRoles("admin", "procurement"), updateVendorStatus);

export default router;
