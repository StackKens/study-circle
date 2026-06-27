import { Router } from "express";
import {
  register,
  login,
  getMe,
  resendVerification,
  verifyEmail,
  testEmail,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe

// Public routes — no token needed
router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyEmail);
router.post("/verify/resend", resendVerification);
router.get("/test-email", testEmail);

// Protected route — token required
router.get("/me", authenticateToken, getMe);

export default router;
