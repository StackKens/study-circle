import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadResource, getMyResources, getAllResources, incrementDownload, getResourceRecommendations } from "../controllers/resources.controller";

const router = Router();

// JWT via Authorization header — inherently CSRF-safe
router.use(authenticateToken);

router.get("/", getMyResources);
router.get("/recommendations", getResourceRecommendations);
router.get("/all", getAllResources);
router.post("/", uploadResource);
router.patch("/:id/download", incrementDownload);

export default router;
