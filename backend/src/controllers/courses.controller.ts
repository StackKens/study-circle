import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db/index";
import { createNotification, notifyCourseStudents } from "../services/notification.service";
import { gradeSubmission, callAiChat } from "../services/ai.service";
import { getIO } from "../sockets/chat.socket";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

async function isInstructor(userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM instructors WHERE user_id = $1`,
    [userId],
  );
  return (r.rowCount ?? 0) > 0;
}

async function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
    [courseId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

// GET /instructors/dashboard — overview stats for instructor home
export async function getInstructorDashboard(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!(await isInstructor(userId))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }

  try {
    const [coursesRes, studentsRes, followersRes, resourcesRes, activityRes] =
      await Promise.all([
        pool.query(
          `SELECT c.id, c.title, c.code, c.description, c.university, c.created_at,
             (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count
           FROM courses c
           WHERE c.instructor_id = $1
           ORDER BY c.created_at DESC`,
          [userId],
        ),
        pool.query(
          `SELECT COUNT(DISTINCT ce.student_id)::int AS count
           FROM course_enrollments ce
           JOIN courses c ON c.id = ce.course_id
           WHERE c.instructor_id = $1`,
          [userId],
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count FROM instructor_followers WHERE instructor_id = $1`,
          [userId],
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM course_resources cr
           JOIN courses c ON c.id = cr.course_id
           WHERE c.instructor_id = $1`,
          [userId],
        ),
        pool.query(
          `(
             SELECT 'announcement' AS type, ca.title AS label, ca.created_at, c.title AS course_title
             FROM course_announcements ca
             JOIN courses c ON c.id = ca.course_id
             WHERE c.instructor_id = $1
           )
           UNION ALL
           (
             SELECT 'submission' AS type, u.name || ' submitted' AS label, s.submitted_at AS created_at, c.title AS course_title
             FROM assignment_submissions s
             JOIN course_assignments a ON a.id = s.assignment_id
             JOIN courses c ON c.id = a.course_id
             JOIN users u ON u.id = s.student_id
             WHERE c.instructor_id = $1
           )
           UNION ALL
           (
             SELECT 'discussion' AS type, cd.title AS label, cd.created_at, c.title AS course_title
             FROM course_discussions cd
             JOIN courses c ON c.id = cd.course_id
             WHERE c.instructor_id = $1 AND cd.is_answered = FALSE
           )
           ORDER BY created_at DESC
           LIMIT 10`,
          [userId],
        ),
      ]);

    res.json({
      courses: coursesRes.rows,
      total_students: studentsRes.rows[0]?.count ?? 0,
      follower_count: followersRes.rows[0]?.count ?? 0,
      resource_count: resourcesRes.rows[0]?.count ?? 0,
      recent_activity: activityRes.rows,
    });
  } catch (err) {
    console.error("getInstructorDashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/enrolled-students — all students enrolled in the instructor's courses
export async function getEnrolledStudents(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.university, ce.course_id, c.title AS course_title, ce.enrolled_at
       FROM course_enrollments ce
       JOIN users u ON u.id = ce.student_id
       JOIN courses c ON c.id = ce.course_id
       WHERE c.instructor_id = $1
       ORDER BY c.title, u.name`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getEnrolledStudents error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/resources — all resources across the instructor's courses
export async function getInstructorResources(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }
  try {
    const result = await pool.query(
      `SELECT cr.*, c.title AS course_title, u.name AS uploaded_by_name
       FROM course_resources cr
       JOIN courses c ON c.id = cr.course_id
       JOIN users u ON u.id = cr.uploaded_by
       WHERE c.instructor_id = $1
       ORDER BY cr.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getInstructorResources error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors — list instructors (for students to follow)
export async function listInstructors(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.university, u.avatar_url,
         i.department, i.bio,
         (SELECT COUNT(*)::int FROM instructor_followers WHERE instructor_id = u.id) AS follower_count,
         (SELECT COUNT(*)::int FROM courses WHERE instructor_id = u.id) AS course_count
         ${userId ? `, EXISTS(SELECT 1 FROM instructor_followers WHERE instructor_id = u.id AND student_id = $1) AS is_following` : ""}
       FROM instructors i
       JOIN users u ON u.id = i.user_id
       ORDER BY follower_count DESC, u.name ASC`,
      userId ? [userId] : [],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("listInstructors error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /instructors/:id/follow
export async function followInstructor(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  const instructorId = paramId(req.params.id);

  if (!studentId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (studentId === instructorId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  try {
    const instructorCheck = await pool.query(
      `SELECT 1 FROM instructors WHERE user_id = $1`,
      [instructorId],
    );
    if (instructorCheck.rowCount === 0) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    await pool.query(
      `INSERT INTO instructor_followers (instructor_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [instructorId, studentId],
    );
    res.json({ success: true, following: true });
  } catch (err) {
    console.error("followInstructor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /instructors/:id/follow
export async function unfollowInstructor(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  const instructorId = paramId(req.params.id);

  if (!studentId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await pool.query(
      `DELETE FROM instructor_followers WHERE instructor_id = $1 AND student_id = $2`,
      [instructorId, studentId],
    );
    res.json({ success: true, following: false });
  } catch (err) {
    console.error("unfollowInstructor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/followers
export async function getMyFollowers(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId || !(await isInstructor(userId))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.university, u.course, u.avatar_url, f.followed_at
       FROM instructor_followers f
       JOIN users u ON u.id = f.student_id
       WHERE f.instructor_id = $1
       ORDER BY f.followed_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMyFollowers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /courses — instructor's courses or student's enrolled courses
export async function listCourses(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const asInstructor = await isInstructor(userId);

    if (asInstructor && req.query.mine !== "false") {
      const result = await pool.query(
        `SELECT c.*,
           (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count,
           (SELECT COUNT(*)::int FROM course_announcements WHERE course_id = c.id) AS announcement_count,
           (SELECT COUNT(*)::int FROM course_assignments WHERE course_id = c.id) AS assignment_count,
           (SELECT COUNT(*)::int FROM course_resources WHERE course_id = c.id) AS resource_count,
           (SELECT COUNT(*)::int FROM course_discussions WHERE course_id = c.id) AS discussion_count
         FROM courses c
         WHERE c.instructor_id = $1
         ORDER BY c.created_at DESC`,
        [userId],
      );
      res.json(result.rows);
      return;
    }

    const result = await pool.query(
      `SELECT c.*, u.name AS instructor_name, u.avatar_url AS instructor_avatar,
         i.department AS instructor_department,
         ce.enrolled_at
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN instructors i ON i.user_id = c.instructor_id
       WHERE ce.student_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("listCourses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses — create course (instructor only)
export async function createCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { title, code, description, university } = req.body;

  if (!userId || !(await isInstructor(userId))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  try {
    const userRes = await pool.query(
      `SELECT university FROM users WHERE id = $1`,
      [userId],
    );
    const result = await pool.query(
      `INSERT INTO courses (instructor_id, title, code, description, university)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        title.trim(),
        code?.trim() || null,
        description?.trim() || null,
        university?.trim() || userRes.rows[0]?.university,
      ],
    );
    const course = result.rows[0];
    const notif = await createNotification(
      userId, "course",
      "Course Created",
      `Your course "${course.title}" has been created.`,
      `/dashboard/instructor/courses`,
    );
    try { getIO().to(`user:${userId}`).emit("notification", notif); } catch {}
    res.status(201).json(course);
  } catch (err) {
    console.error("createCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, code, description } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!(await ownsCourse(userId, courseId))) {
    res.status(403).json({ error: "Only the course instructor can edit this course" });
    return;
  }

  if (title !== undefined && !title?.trim()) {
    res.status(400).json({ error: "Title cannot be empty" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE courses
       SET title = COALESCE(NULLIF($1, ''), title),
           code = COALESCE(NULLIF($2, ''), code),
           description = $3
       WHERE id = $4
       RETURNING *`,
      [
        title?.trim() ?? null,
        code?.trim() ?? null,
        description?.trim() ?? null,
        courseId,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /courses/:id
export async function getCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS instructor_name, u.avatar_url AS instructor_avatar,
         i.department, i.bio AS instructor_bio,
         (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN instructors i ON i.user_id = c.instructor_id
       WHERE c.id = $1`,
      [courseId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const course = result.rows[0];
    const isOwner = course.instructor_id === userId;
    const enrolled = await pool.query(
      `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
      [courseId, userId],
    );

    if (!isOwner && enrolled.rowCount === 0) {
      res.status(403).json({ error: "Not enrolled in this course" });
      return;
    }

    res.json({ ...course, is_owner: isOwner });
  } catch (err) {
    console.error("getCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/enroll — student enrolls
export async function enrollCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (await isInstructor(userId)) {
    res.status(400).json({ error: "Instructors cannot enroll as students" });
    return;
  }

  try {
    const courseCheck = await pool.query(
      `SELECT id FROM courses WHERE id = $1`,
      [courseId],
    );
    if (courseCheck.rowCount === 0) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [courseId, userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("enrollCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

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

    // Instructors see everything; enrolled students only see resources
    // that are either specific to their course (always visible) OR public
    const instrCheck = await isInstructor(userId);
    const query = instrCheck
      ? `SELECT cr.*, u.name AS uploaded_by_name
         FROM course_resources cr
         JOIN users u ON u.id = cr.uploaded_by
         WHERE cr.course_id = $1
         ORDER BY cr.created_at DESC`
      : `SELECT cr.*, u.name AS uploaded_by_name
         FROM course_resources cr
         JOIN users u ON u.id = cr.uploaded_by
         WHERE cr.course_id = $1
         ORDER BY cr.created_at DESC`;

    const result = await pool.query(query, [courseId]);
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

// GET /courses/:id/assignments
export async function getAssignments(req: AuthRequest, res: Response) {
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

    const isOwner = await ownsCourse(userId, courseId);

    if (isOwner) {
      const result = await pool.query(
        `SELECT a.*,
           (SELECT COUNT(*)::int FROM assignment_submissions WHERE assignment_id = a.id) AS submission_count
         FROM course_assignments a
         WHERE a.course_id = $1
         ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
        [courseId],
      );
      res.json(result.rows);
      return;
    }

    const result = await pool.query(
      `SELECT a.*,
         s.id IS NOT NULL AS submitted,
         s.grade, s.feedback, s.strengths, s.weaknesses, s.graded_at
       FROM course_assignments a
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $2
       WHERE a.course_id = $1
       ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
      [courseId, userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAssignments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/assignments
export async function createAssignment(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, description, due_date } = req.body;

  if (!userId || !(await ownsCourse(userId, courseId))) {
    res.status(403).json({ error: "Only the course instructor can create assignments" });
    return;
  }

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO course_assignments (course_id, title, description, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [courseId, title.trim(), description?.trim() || null, due_date || null, userId],
    );
    const assignment = result.rows[0];
    const courseRes = await pool.query(`SELECT title FROM courses WHERE id = $1`, [courseId]);
    const courseTitle = courseRes.rows[0]?.title || "";
    const notifLink = `/dashboard/courses/${courseId}?assignment=${assignment.id}`;
    const notifStudents = await notifyCourseStudents(
      courseId, userId, "course_assignment",
      "New Assignment",
      `"${assignment.title}" assigned in ${courseTitle}.${due_date ? ` Due: ${new Date(due_date).toLocaleDateString()}` : ""}`,
      notifLink,
    );
    const notif = { type: "course_assignment", title: "New Assignment", message: `"${assignment.title}" assigned in ${courseTitle}.${due_date ? ` Due: ${new Date(due_date).toLocaleDateString()}` : ""}`, link: notifLink };
    for (const m of notifStudents) {
      try { getIO().to(`user:${m.student_id}`).emit("notification", notif); } catch {}
    }
    res.status(201).json(assignment);
  } catch (err) {
    console.error("createAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /assignments/:id/submissions — instructor views submissions
export async function getSubmissions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const assignmentId = paramId(req.params.id);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const assignment = await pool.query(
      `SELECT a.*, c.instructor_id FROM course_assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE a.id = $1`,
      [assignmentId],
    );
    if (assignment.rows.length === 0) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }
    if (assignment.rows[0].instructor_id !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await pool.query(
      `SELECT s.*, u.name AS student_name, u.email AS student_email
       FROM assignment_submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getSubmissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /assignments/:id/submit — student submits
export async function submitAssignment(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const assignmentId = paramId(req.params.id);
  const { content, url } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const assignment = await pool.query(
      `SELECT a.course_id, a.due_date FROM course_assignments a WHERE a.id = $1`,
      [assignmentId],
    );
    if (assignment.rows.length === 0) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    if (assignment.rows[0].due_date && new Date(assignment.rows[0].due_date) < new Date()) {
      res.status(403).json({ error: "Submission deadline has passed" });
      return;
    }

    const enrolled = await pool.query(
      `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
      [assignment.rows[0].course_id, userId],
    );
    if (enrolled.rowCount === 0) {
      res.status(403).json({ error: "Not enrolled in this course" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, content, url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET content = EXCLUDED.content, url = EXCLUDED.url, submitted_at = NOW()
       RETURNING *`,
      [assignmentId, userId, content?.trim() || null, url?.trim() || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("submitAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /assignments/:id/grade/:studentId — instructor grades a submission (AI)
export async function gradeAssignment(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const assignmentId = paramId(req.params.id);
  const studentId = paramId(req.params.studentId);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const assignment = await pool.query(
      `SELECT a.*, c.instructor_id, c.id AS course_id, c.title AS course_title
       FROM course_assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE a.id = $1`,
      [assignmentId],
    );
    if (assignment.rows.length === 0) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }
    if (assignment.rows[0].instructor_id !== userId) {
      res.status(403).json({ error: "Only the course instructor can grade" });
      return;
    }

    const submission = await pool.query(
      `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId],
    );
    if (submission.rows.length === 0) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const sub = submission.rows[0];
    const result = await gradeSubmission(
      sub.content || "",
      assignment.rows[0].title,
      assignment.rows[0].description,
    );

    await pool.query(
      `UPDATE assignment_submissions
       SET grade = $1, feedback = $2, strengths = $3, weaknesses = $4, graded_at = NOW(), graded_by = $5
       WHERE id = $6`,
      [
        result.score,
        result.feedback,
        JSON.stringify(result.strengths),
        JSON.stringify(result.weaknesses),
        userId,
        sub.id,
      ],
    );

    const studentRes = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [studentId],
    );
    const studentName = studentRes.rows[0]?.name || "Student";

    const notifLink = `/dashboard/courses/${assignment.rows[0].course_id}?assignment=${assignmentId}`;
    await createNotification(
      studentId,
      "assignment_graded",
      "Assignment Graded",
      `Your submission for "${assignment.rows[0].title}" has been graded — ${result.score}/100`,
      notifLink,
    );
    try {
      getIO().to(`user:${studentId}`).emit("notification", {
        type: "assignment_graded",
        title: "Assignment Graded",
        message: `Your submission for "${assignment.rows[0].title}" has been graded — ${result.score}/100`,
        link: notifLink,
      });
    } catch {}

    res.json({
      ...sub,
      grade: result.score,
      feedback: result.feedback,
      strengths: JSON.stringify(result.strengths),
      weaknesses: JSON.stringify(result.weaknesses),
      graded_at: new Date().toISOString(),
      graded_by: userId,
    });
  } catch (err) {
    console.error("gradeAssignment error:", err);
    res.status(503).json({ error: "AI grading unavailable. Please try again later or grade manually." });
  }
}

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
      `SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM course_discussion_replies r
       JOIN users u ON u.id = r.author_id
       WHERE r.discussion_id = $1
       ORDER BY r.created_at ASC`,
      [discussionId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getDiscussionReplies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function canAccessCourse(
  userId: string,
  courseId: string,
): Promise<boolean> {
  if (await ownsCourse(userId, courseId)) return true;
  const r = await pool.query(
    `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
    [courseId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

// POST /courses/:id/chat — AI tutor chat scoped to a course
export async function chatWithAI(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { message, history } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    const course = await pool.query(
      `SELECT title, description FROM courses WHERE id = $1`,
      [courseId],
    );
    if (course.rows.length === 0) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const systemMsg = `You are a helpful AI tutor for the course "${course.rows[0].title}". ${course.rows[0].description ? `Course description: ${course.rows[0].description}` : ""} Answer the student's questions clearly and concisely. If you don't know something, say so honestly. Keep responses under 200 words.`;

    const messages = [
      { role: "system", content: systemMsg },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const reply = await callAiChat(messages);
    if (!reply) {
      res.status(503).json({ error: "AI tutor is temporarily unavailable. Please try again." });
      return;
    }

    res.json({ reply });
  } catch (err) {
    console.error("chatWithAI error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /courses/available — courses student can browse and enroll
export async function listAvailableCourses(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT c.*, c.instructor_id, u.name AS instructor_name, u.avatar_url AS instructor_avatar,
         i.department,
         (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count,
         EXISTS(SELECT 1 FROM course_enrollments WHERE course_id = c.id AND student_id = $1) AS is_enrolled
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN instructors i ON i.user_id = c.instructor_id
       ORDER BY c.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("listAvailableCourses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
