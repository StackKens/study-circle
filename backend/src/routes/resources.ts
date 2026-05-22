import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadResource, getMyResources, getAllResources } from "../controllers/resources.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMyResources);
router.get("/all", getAllResources);
router.post("/", uploadResource);

export default router;
