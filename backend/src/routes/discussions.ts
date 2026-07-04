import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getDiscussions,
  createDiscussion,
  replyToDiscussion,
  getDiscussionReplies,
  getInstructorDiscussions,
  createInstructorDiscussion,
  editReply,
  toggleReplyLike,
} from "../controllers/discussions.controller";

const router = Router();

router.get("/instructors/me/discussions", authenticateToken, getInstructorDiscussions);
router.post("/instructors/me/discussions", authenticateToken, createInstructorDiscussion);
router.get("/courses/:id/discussions", authenticateToken, getDiscussions);
router.post("/courses/:id/discussions", authenticateToken, createDiscussion);
router.post("/discussions/:id/reply", authenticateToken, replyToDiscussion);
router.put("/discussions/reply/:replyId", authenticateToken, editReply);
router.post("/discussions/reply/:replyId/like", authenticateToken, toggleReplyLike);
router.get("/discussions/:id/replies", authenticateToken, getDiscussionReplies);

export default router;
