import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadResource, getMyResources } from "../controllers/resources.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMyResources);
router.post("/", uploadResource);

export default router;
