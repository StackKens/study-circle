import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getUserStats,
  getUserGroups,
  getUserBadges,
  getUserBio,
  updateUserBio,
} from "../controllers/user.controller";

const router = Router();

// All routes require authentication (except GET bio – it's public, but we still need token for identification)
router.use(authenticateToken);

// User's own data
router.get("/me/stats", getUserStats);
router.get("/me/groups", getUserGroups);
router.get("/me/badges", getUserBadges);

router.get("/:id/bio", getUserBio);
router.patch("/:id/bio", updateUserBio);

export default router;
