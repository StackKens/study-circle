import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createGroup,
  getGroupMembers,
  getGroupRecommendations,
  getMyGroups,
  joinGroup,
} from "../controllers/groups.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMyGroups);
router.get("/recommendations", getGroupRecommendations);
router.get("/:id/members", getGroupMembers);
router.post("/", createGroup);
router.post("/:id/join", joinGroup);

export default router;
