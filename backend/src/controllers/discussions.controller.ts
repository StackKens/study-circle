import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db";
import { paramId, canAccessCourse, isInstructor } from "../utils/course-helpers";
import { notifyCourseStudents } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";

// GET /courses/:id/discussions
export async function getDiscussions(req: AuthRequest, res: Response) {
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
      `SELECT cd.*, u.name AS author_name, u.avatar_url AS author_avatar,
         (SELECT COUNT(*)::int FROM course_discussion_replies WHERE discussion_id = cd.id) AS reply_count
       FROM course_discussions cd
       JOIN users u ON u.id = cd.author_id
       WHERE cd.course_id = $1
       ORDER BY cd.created_at DESC`,
      [courseId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getDiscussions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/discussions
export async function createDiscussion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, content } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    if (!(await canAccessCourse(userId, courseId))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO course_discussions (course_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, userId, title.trim(), content.trim()],
    );
    const discussion = result.rows[0];
    const courseRes = await pool.query(`SELECT title FROM courses WHERE id = $1`, [courseId]);
    const courseTitle = courseRes.rows[0]?.title || "";
    const notifStudents = await notifyCourseStudents(
      courseId, userId, "course_discussion",
      "New Discussion",
      `"${discussion.title}" started in ${courseTitle}.`,
      `/dashboard/courses/${courseId}`,
    );
    const notif = { type: "course_discussion", title: "New Discussion", message: `"${discussion.title}" started in ${courseTitle}.`, link: `/dashboard/courses/${courseId}` };
    for (const m of notifStudents) {
      try { getIO().to(`user:${m.student_id}`).emit("notification", notif); } catch {}
    }
    res.status(201).json(discussion);
  } catch (err) {
    console.error("createDiscussion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /discussions/:id/reply
export async function replyToDiscussion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const discussionId = paramId(req.params.id);
  const { content } = req.body;

  if (!userId || !content?.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  try {
    const disc = await pool.query(
      `SELECT cd.course_id, c.instructor_id FROM course_discussions cd
       JOIN courses c ON c.id = cd.course_id
       WHERE cd.id = $1`,
      [discussionId],
    );
    if (disc.rows.length === 0) {
      res.status(404).json({ error: "Discussion not found" });
      return;
    }

    const { course_id, instructor_id } = disc.rows[0];
    const access = await canAccessCourse(userId, course_id);
    if (!access) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO course_discussion_replies (discussion_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [discussionId, userId, content.trim()],
    );

    if (userId === instructor_id) {
      await pool.query(
        `UPDATE course_discussions SET is_answered = TRUE WHERE id = $1`,
        [discussionId],
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("replyToDiscussion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /discussions/:id/replies
export async function getDiscussionReplies(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const discussionId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const disc = await pool.query(
      `SELECT course_id FROM course_discussions WHERE id = $1`,
      [discussionId],
    );
    if (disc.rows.length === 0) {
      res.status(404).json({ error: "Discussion not found" });
      return;
    }

    if (!(await canAccessCourse(userId, disc.rows[0].course_id))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await pool.query(
      `SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar,
         (SELECT COUNT(*)::int FROM course_discussion_reply_likes WHERE reply_id = r.id) AS like_count,
         EXISTS(SELECT 1 FROM course_discussion_reply_likes WHERE reply_id = r.id AND user_id = $2) AS liked
       FROM course_discussion_replies r
       JOIN users u ON u.id = r.author_id
       WHERE r.discussion_id = $1
       ORDER BY r.created_at ASC`,
      [discussionId, userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getDiscussionReplies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/discussions — all discussions across instructor's courses
export async function getInstructorDiscussions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  try {
    const result = await pool.query(
      `SELECT cd.*, u.name AS author_name, u.avatar_url AS author_avatar,
         (SELECT COUNT(*)::int FROM course_discussion_replies WHERE discussion_id = cd.id) AS reply_count,
         c.id AS course_id, c.title AS course_title
       FROM course_discussions cd
       JOIN users u ON u.id = cd.author_id
       JOIN courses c ON c.id = cd.course_id
       WHERE c.instructor_id = $1
       ORDER BY cd.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getInstructorDiscussions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /instructors/me/discussions — instructor creates a thread in a course
export async function createInstructorDiscussion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { course_id, title, content } = req.body;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  try {
    const owns = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
      [course_id, userId],
    );
    if (owns.rows.length === 0) { res.status(403).json({ error: "You don't own this course" }); return; }

    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO course_discussions (course_id, author_id, title, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, userId, title.trim(), content.trim()],
    );
    const discussion = result.rows[0];
    const courseRes = await pool.query(`SELECT title FROM courses WHERE id = $1`, [course_id]);
    const courseTitle = courseRes.rows[0]?.title || "";
    const notifStudents = await notifyCourseStudents(
      course_id, userId, "course_discussion",
      "New Discussion",
      `"${discussion.title}" started in ${courseTitle}.`,
      `/dashboard/courses/${course_id}`,
    );
    const notif = { type: "course_discussion", title: "New Discussion", message: `"${discussion.title}" started in ${courseTitle}.`, link: `/dashboard/courses/${course_id}` };
    for (const m of notifStudents) {
      try { getIO().to(`user:${m.student_id}`).emit("notification", notif); } catch {}
    }
    res.status(201).json(discussion);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /discussions/reply/:replyId — edit your own reply
export async function editReply(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const replyId = paramId(req.params.replyId);
  const { content } = req.body;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!content?.trim()) { res.status(400).json({ error: "Content is required" }); return; }

  try {
    const existing = await pool.query(
      `SELECT author_id FROM course_discussion_replies WHERE id = $1`,
      [replyId],
    );
    if (existing.rows.length === 0) { res.status(404).json({ error: "Reply not found" }); return; }
    if (existing.rows[0].author_id !== userId) { res.status(403).json({ error: "You can only edit your own replies" }); return; }

    const result = await pool.query(
      `UPDATE course_discussion_replies SET content = $1 WHERE id = $2 RETURNING *`,
      [content.trim(), replyId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("editReply error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /discussions/reply/:replyId/like — toggle like on a reply
export async function toggleReplyLike(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const replyId = paramId(req.params.replyId);

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const existing = await pool.query(
      `SELECT id FROM course_discussion_reply_likes WHERE reply_id = $1 AND user_id = $2`,
      [replyId, userId],
    );
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM course_discussion_reply_likes WHERE id = $1`, [existing.rows[0].id]);
      res.json({ liked: false });
    } else {
      await pool.query(
        `INSERT INTO course_discussion_reply_likes (reply_id, user_id) VALUES ($1, $2)`,
        [replyId, userId],
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error("toggleReplyLike error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
