import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db";
import { paramId, canAccessCourse, ownsCourse } from "../utils/course-helpers";

// GET /courses/:id/resources
export async function getCourseResources(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    if (!(await canAccessCourse(userId, courseId))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await pool.query(
      `SELECT cr.*, u.name AS uploaded_by_name
       FROM course_resources cr
       JOIN users u ON u.id = cr.uploaded_by
       WHERE cr.course_id = $1
       ORDER BY cr.created_at DESC`,
      [courseId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getCourseResources error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/resources
export async function uploadCourseResource(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, type, url, is_public } = req.body;

  if (!userId || !(await ownsCourse(userId, courseId))) {
    res.status(403).json({ error: "Only the course instructor can upload resources" });
    return;
  }

  if (!title?.trim() || !type || !url?.trim()) {
    res.status(400).json({ error: "Title, type, and url are required" });
    return;
  }

  const validTypes = ["pdf", "slides", "document", "link"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "type must be one of: pdf, slides, document, link" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO course_resources (course_id, title, type, url, uploaded_by, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, title.trim(), type, url.trim(), userId, is_public === true],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("uploadCourseResource error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
