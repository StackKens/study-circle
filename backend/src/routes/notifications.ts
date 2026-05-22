import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getNotifications } from "../controllers/notifications.controller";

const router = Router();

router.use(authenticateToken);

router.get("/", getNotifications);

export default router;
