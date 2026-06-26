import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createSession,
  getMySessions,
  joinSession,
  getSessionAttendees,
  getRecentActivity,
} from "../controllers/sessions.controller";

const router = Router();

router.use(authenticateToken);

router.get("/", getMySessions);
router.get("/recent-activity", getRecentActivity);
router.get("/:id/attendees", getSessionAttendees);
router.post("/", createSession);
router.post("/:id/join", joinSession);

export default router;
