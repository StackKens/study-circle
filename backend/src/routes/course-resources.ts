import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getCourseResources, uploadCourseResource } from "../controllers/course-resources.controller";

const router = Router();

router.get("/courses/:id/resources", authenticateToken, getCourseResources);
router.post("/courses/:id/resources", authenticateToken, uploadCourseResource);

export default router;
