import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getUserStats, getUserGroups, getUserBadges, getUserBio, updateUserBio, getUserProgress } from "../controllers/user.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe

// All routes require authentication
router.use(authenticateToken);

// User's own data
router.get("/me/stats", getUserStats);
router.get("/me/groups", getUserGroups);
router.get("/me/badges", getUserBadges);
router.get("/me/progress", getUserProgress);

router.get("/:id/bio", getUserBio);
router.patch("/:id/bio", updateUserBio);

export default router;
