import { Router } from "express";
import {
  register,
  login,
  getMe,
  resendVerification,
  verifyEmail,
  findInstructors,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe

// Public routes — no token needed
router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyEmail);
router.post("/verify/resend", resendVerification);
router.get("/find-instructors", findInstructors);

// Protected route — token required
router.get("/me", authenticateToken, getMe);

export default router;
