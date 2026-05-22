import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { createGroup, getMyGroups } from "../controllers/groups.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMyGroups);
router.post("/", createGroup);

export default router;
