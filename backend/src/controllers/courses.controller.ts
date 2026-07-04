import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db";
import { paramId, isInstructor, ownsCourse } from "../utils/course-helpers";
import { callAiChat } from "../services/ai.service";

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
      `SELECT u.id, u.name, u.email, u.university, u.avatar_url,
              i.department, i.bio,
              (SELECT COUNT(*)::int FROM instructor_followers WHERE instructor_id = u.id) AS follower_count,
              EXISTS(SELECT 1 FROM instructor_followers WHERE instructor_id = u.id AND follower_id = $1) AS is_following
       FROM users u
       JOIN instructors i ON i.user_id = u.id
       ORDER BY follower_count DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("listInstructors error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /instructors/:id/follow — student follows an instructor
export async function followInstructor(req: AuthRequest, res: Response) {
  const followerId = req.user?.id;
  const instructorId = paramId(req.params.id);

  if (!followerId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (followerId === instructorId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  try {
    const inst = await pool.query(`SELECT 1 FROM instructors WHERE user_id = $1`, [instructorId]);
    if (inst.rowCount === 0) { res.status(404).json({ error: "Instructor not found" }); return; }

    await pool.query(
      `INSERT INTO instructor_followers (instructor_id, follower_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [instructorId, followerId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("followInstructor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /instructors/:id/follow — unfollow
export async function unfollowInstructor(req: AuthRequest, res: Response) {
  const followerId = req.user?.id;
  const instructorId = paramId(req.params.id);

  if (!followerId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    await pool.query(
      `DELETE FROM instructor_followers WHERE instructor_id = $1 AND follower_id = $2`,
      [instructorId, followerId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("unfollowInstructor error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/followers — list followers
export async function getMyFollowers(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.university, u.avatar_url, f.created_at AS followed_at
       FROM instructor_followers f
       JOIN users u ON u.id = f.follower_id
       WHERE f.instructor_id = $1
       ORDER BY f.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMyFollowers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /courses — instructor gets own courses, student gets enrolled courses
export async function listCourses(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    if (await isInstructor(userId)) {
      const result = await pool.query(
        `SELECT c.id, c.title, c.code, c.description, c.university, c.created_at,
                (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count
         FROM courses c
         WHERE c.instructor_id = $1
         ORDER BY c.created_at DESC`,
        [userId],
      );
      res.json(result.rows);
    } else {
      const result = await pool.query(
        `SELECT c.*, c.instructor_id, u.name AS instructor_name,
                (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count
         FROM course_enrollments ce
         JOIN courses c ON c.id = ce.course_id
         JOIN users u ON u.id = c.instructor_id
         WHERE ce.student_id = $1
         ORDER BY ce.enrolled_at DESC`,
        [userId],
      );
      res.json(result.rows);
    }
  } catch (err) {
    console.error("listCourses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses — instructor creates a new course
export async function createCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { title, code, description, university } = req.body;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }
  if (!title?.trim()) { res.status(400).json({ error: "Title is required" }); return; }

  try {
    const result = await pool.query(
      `INSERT INTO courses (instructor_id, title, code, description, university)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title.trim(), code?.trim() || null, description?.trim() || null, university?.trim() || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /courses/:id — instructor updates their course
export async function updateCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);
  const { title, code, description, university } = req.body;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    if (!(await ownsCourse(userId, courseId))) {
      res.status(403).json({ error: "Only the course instructor can update the course" });
      return;
    }

    const result = await pool.query(
      `UPDATE courses SET title = COALESCE($1, title), code = COALESCE($2, code),
        description = COALESCE($3, description), university = COALESCE($4, university)
       WHERE id = $5 RETURNING *`,
      [title?.trim() || null, code?.trim() || null, description?.trim() || null, university?.trim() || null, courseId],
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "Course not found" }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /courses/:id — get a single course
export async function getCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS instructor_name,
              (SELECT COUNT(*)::int FROM course_enrollments WHERE course_id = c.id) AS student_count
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       WHERE c.id = $1`,
      [courseId],
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "Course not found" }); return; }

    const course = result.rows[0];
    course.is_owner = userId === course.instructor_id;

    if (!course.is_owner) {
      const enrolled = await pool.query(
        `SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
        [courseId, userId],
      );
      course.is_enrolled = (enrolled.rowCount ?? 0) > 0;
    }

    res.json(course);
  } catch (err) {
    console.error("getCourse error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /courses/:id/enroll — student enrolls in a course
export async function enrollCourse(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const courseId = paramId(req.params.id);

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (await isInstructor(userId)) { res.status(403).json({ error: "Instructors cannot enroll in courses" }); return; }

  try {
    const course = await pool.query(`SELECT 1 FROM courses WHERE id = $1`, [courseId]);
    if (course.rows.length === 0) { res.status(404).json({ error: "Course not found" }); return; }

    await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [courseId, userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("enrollCourse error:", err);
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
