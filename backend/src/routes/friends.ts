import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendRecommendations,
} from "../controllers/friends.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getFriends);
router.get("/recommendations", getFriendRecommendations);
router.get("/requests", getFriendRequests);
router.get("/search", searchUsers);
router.post("/request/:id", sendFriendRequest);
router.patch("/request/:id/accept", acceptFriendRequest);
router.patch("/request/:id/decline", declineFriendRequest);
router.delete("/:id", removeFriend);

export default router;
