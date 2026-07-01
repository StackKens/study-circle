import { Router, Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getInstructorDashboard,
  listInstructors,
  followInstructor,
  unfollowInstructor,
  getMyFollowers,
  listCourses,
  createCourse,
  updateCourse,
  getCourse,
  enrollCourse,
  getAnnouncements,
  createAnnouncement,
  getCourseResources,
  uploadCourseResource,
  getAssignments,
  createAssignment,
  getSubmissions,
  submitAssignment,
  getDiscussions,
  createDiscussion,
  replyToDiscussion,
  listAvailableCourses,
  getDiscussionReplies,
} from "../controllers/courses.controller";

const router = Router();

// Short cache for browse-only GET endpoints (60s fresh, 5 min stale-while-revalidate)
function shortCache(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  next();
}

// Instructor routes
router.get("/instructors/dashboard", authenticateToken, getInstructorDashboard);
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

router.get("/courses/:id/announcements", authenticateToken, getAnnouncements);
router.post("/courses/:id/announcements", authenticateToken, createAnnouncement);

router.get("/courses/:id/resources", authenticateToken, getCourseResources);
router.post("/courses/:id/resources", authenticateToken, uploadCourseResource);

router.get("/courses/:id/assignments", authenticateToken, getAssignments);
router.post("/courses/:id/assignments", authenticateToken, createAssignment);

router.get("/courses/:id/discussions", authenticateToken, getDiscussions);
router.post("/courses/:id/discussions", authenticateToken, createDiscussion);

router.get("/assignments/:id/submissions", authenticateToken, getSubmissions);
router.post("/assignments/:id/submit", authenticateToken, submitAssignment);

router.post("/discussions/:id/reply", authenticateToken, replyToDiscussion);
router.get("/discussions/:id/replies", authenticateToken, getDiscussionReplies);

export default router;
