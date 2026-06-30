import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  listConversations,
  getMessageHistory,
  searchUsers,
} from "../controllers/messages.controller";

const router = Router();

router.get("/conversations", authenticateToken, listConversations);
router.get("/search", authenticateToken, searchUsers);
router.get("/:userId", authenticateToken, getMessageHistory);

export default router;
