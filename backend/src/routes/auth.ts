import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe

// Public routes — no token needed
router.post("/register", register);
router.post("/login", login);

// Protected route — token required
router.get("/me", authenticateToken, getMe);

export default router;
