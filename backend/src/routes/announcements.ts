import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getAnnouncements, createAnnouncement } from "../controllers/announcements.controller";

const router = Router();

router.get("/courses/:id/announcements", authenticateToken, getAnnouncements);
router.post("/courses/:id/announcements", authenticateToken, createAnnouncement);

export default router;
