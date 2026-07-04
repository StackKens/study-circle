import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db";
import { paramId, canAccessCourse, ownsCourse } from "../utils/course-helpers";
import { notifyCourseStudents } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";

// GET /courses/:id/announcements
export async function getAnnouncements(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const access = await canAccessCourse(userId, courseId);
    if (!access) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await pool.query(
      `SELECT ca.*, u.name AS author_name
       FROM course_announcements ca
       JOIN users u ON u.id = ca.author_id
       WHERE ca.course_id = $1
       ORDER BY ca.created_at DESC`,
      [courseId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAnnouncements error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/announcements
export async function createAnnouncement(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, content } = req.body;

  if (!userId || !(await ownsCourse(userId, courseId))) {
    res.status(403).json({ error: "Only the course instructor can post announcements" });
    return;
  }

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Title and content are required" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO course_announcements (course_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, userId, title.trim(), content.trim()],
    );
    const announcement = result.rows[0];
    const courseRes = await pool.query(`SELECT title FROM courses WHERE id = $1`, [courseId]);
    const courseTitle = courseRes.rows[0]?.title || "";
    const notifStudents = await notifyCourseStudents(
      courseId, userId, "course_announcement",
      "New Announcement",
      `"${announcement.title}" posted in ${courseTitle}.`,
      `/dashboard/courses/${courseId}`,
    );
    const notif = { type: "course_announcement", title: "New Announcement", message: `"${announcement.title}" posted in ${courseTitle}.`, link: `/dashboard/courses/${courseId}` };
    for (const m of notifStudents) {
      try { getIO().to(`user:${m.student_id}`).emit("notification", notif); } catch {}
    }
    res.status(201).json(announcement);
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
