import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { createSession, getMySessions, joinSession } from "../controllers/sessions.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMySessions);
router.post("/", createSession);
router.post("/:id/join", joinSession);

export default router;
