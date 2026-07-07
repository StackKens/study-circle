import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createGroup,
  getGroup,
  getGroupMembers,
  getGroupRecommendations,
  getMyGroups,
  joinGroup,
  leaveGroup,
  generateInviteLink,
  acceptInvite,
} from "../controllers/groups.controller";

const router = Router();

router.use(authenticateToken);

router.get("/", getMyGroups);
router.get("/recommendations", getGroupRecommendations);
router.get("/:id", getGroup);
router.get("/:id/members", getGroupMembers);
router.post("/", createGroup);
router.post("/:id/join", joinGroup);
router.delete("/:id/leave", leaveGroup);

// Invite link endpoints
router.post("/:id/invite", generateInviteLink);          // admin generates link
router.post("/invite/:token/accept", acceptInvite);      // anyone accepts link

export default router;
