import { Router, Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getInstructorDashboard,
  getEnrolledStudents,
  getInstructorResources,
  listInstructors,
  followInstructor,
  unfollowInstructor,
  getMyFollowers,
  listCourses,
  createCourse,
  updateCourse,
  getCourse,
  enrollCourse,
  listAvailableCourses,
  chatWithAI,
  listChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  getChatSessionMessages,
} from "../controllers/courses.controller";

const router = Router();

// Short cache for browse-only GET endpoints (60s fresh, 5 min stale-while-revalidate)
function shortCache(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  next();
}

// Instructor routes
router.get("/instructors/dashboard", authenticateToken, getInstructorDashboard);
router.get("/instructors/me/enrolled-students", authenticateToken, getEnrolledStudents);
router.get("/instructors/me/resources", authenticateToken, getInstructorResources);
router.get("/instructors", authenticateToken, shortCache, listInstructors);
router.get("/instructors/me/followers", authenticateToken, getMyFollowers);
router.post("/instructors/:id/follow", authenticateToken, followInstructor);
router.delete("/instructors/:id/follow", authenticateToken, unfollowInstructor);

// Course routes
router.get("/courses/available", authenticateToken, shortCache, listAvailableCourses);
router.get("/courses", authenticateToken, shortCache, listCourses);
router.post("/courses", authenticateToken, createCourse);
router.get("/courses/:id", authenticateToken, shortCache, getCourse);
router.put("/courses/:id", authenticateToken, updateCourse);
router.post("/courses/:id/enroll", authenticateToken, enrollCourse);

// Chat session routes
router.get("/courses/:id/chat/sessions", authenticateToken, listChatSessions);
router.post("/courses/:id/chat/sessions", authenticateToken, createChatSession);
router.put("/courses/:id/chat/sessions/:sid", authenticateToken, updateChatSession);
router.delete("/courses/:id/chat/sessions/:sid", authenticateToken, deleteChatSession);

// Chat messages within a session
router.get("/courses/:id/chat/sessions/:sid/messages", authenticateToken, getChatSessionMessages);
router.post("/courses/:id/chat", authenticateToken, chatWithAI);

export default router;
