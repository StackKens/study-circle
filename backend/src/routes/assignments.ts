import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getAssignments,
  createAssignment,
  getSubmissions,
  submitAssignment,
  gradeAssignment,
  getInstructorSubmissions,
} from "../controllers/assignments.controller";

const router = Router();

router.get("/courses/:id/assignments", authenticateToken, getAssignments);
router.post("/courses/:id/assignments", authenticateToken, createAssignment);
router.get("/instructors/me/submissions", authenticateToken, getInstructorSubmissions);
router.get("/assignments/:id/submissions", authenticateToken, getSubmissions);
router.post("/assignments/:id/submit", authenticateToken, submitAssignment);
router.post("/assignments/:id/grade/:studentId", authenticateToken, gradeAssignment);

export default router;
