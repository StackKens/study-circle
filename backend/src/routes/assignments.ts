import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getAssignments,
  createAssignment,
  getSubmissions,
  submitAssignment,
  gradeAssignment,
  getInstructorSubmissions,
  getInstructorAssignments,
  createInstructorAssignment,
} from "../controllers/assignments.controller";

const router = Router();

router.get("/instructors/me/assignments", authenticateToken, getInstructorAssignments);
router.post("/instructors/me/assignments", authenticateToken, createInstructorAssignment);
router.get("/courses/:id/assignments", authenticateToken, getAssignments);
router.post("/courses/:id/assignments", authenticateToken, createAssignment);
router.get("/instructors/me/submissions", authenticateToken, getInstructorSubmissions);
router.get("/assignments/:id/submissions", authenticateToken, getSubmissions);
router.post("/assignments/:id/submit", authenticateToken, submitAssignment);
router.post("/assignments/:id/grade/:studentId", authenticateToken, gradeAssignment);

export default router;
