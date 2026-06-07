import { Router } from "express";
import { getUserById, getUsers, updateUserStatus } from "../controllers/user.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, allowRoles("admin"), getUsers);
router.get("/:id", requireAuth, allowRoles("admin"), getUserById);
router.patch("/:id/status", requireAuth, allowRoles("admin"), updateUserStatus);

export default router;
