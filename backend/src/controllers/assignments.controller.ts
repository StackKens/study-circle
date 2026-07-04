import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db";
import { paramId, canAccessCourse, ownsCourse, isInstructor } from "../utils/course-helpers";
import { createNotification, notifyCourseStudents } from "../services/notification.service";
import { gradeSubmission } from "../services/ai.service";
import { getIO } from "../sockets/chat.socket";

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
  const { title, description, due_date, file_url } = req.body;

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
      `INSERT INTO course_assignments (course_id, title, description, due_date, file_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, title.trim(), description?.trim() || null, due_date || null, file_url || null, userId],
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
  const { grade, feedback, strengths, weaknesses } = req.body;

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
    let result;

    if (grade != null) {
      // Manual grading
      result = {
        score: Math.max(0, Math.min(100, Number(grade))),
        feedback: feedback?.trim() || null,
        strengths: Array.isArray(strengths) ? strengths : [],
        weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
      };
    } else {
      // AI grading
      result = await gradeSubmission(
        sub.content || "",
        assignment.rows[0].title,
        assignment.rows[0].description,
      );
    }

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

// GET /instructors/me/submissions — all submissions across all courses for instructor
export async function getInstructorSubmissions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  try {
    const result = await pool.query(
      `SELECT s.id, s.assignment_id, s.student_id, s.content, s.url, s.submitted_at,
              s.grade, s.feedback, s.graded_at,
              u.name AS student_name, u.email AS student_email,
              a.title AS assignment_title, a.due_date,
              c.id AS course_id, c.title AS course_title
       FROM assignment_submissions s
       JOIN course_assignments a ON a.id = s.assignment_id
       JOIN courses c ON c.id = a.course_id
       JOIN users u ON u.id = s.student_id
       WHERE c.instructor_id = $1
       ORDER BY s.submitted_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getInstructorSubmissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /instructors/me/assignments — all assignments across instructor's courses
export async function getInstructorAssignments(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  try {
    const result = await pool.query(
      `SELECT a.*,
         (SELECT COUNT(*)::int FROM assignment_submissions WHERE assignment_id = a.id) AS submission_count,
         c.id AS course_id, c.title AS course_title
       FROM course_assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE c.instructor_id = $1
       ORDER BY a.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getInstructorAssignments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /students/me/assignments — all assignments across enrolled courses (student view)
export async function getStudentAssignments(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const result = await pool.query(
      `SELECT a.*,
         c.id AS course_id, c.title AS course_title, c.code AS course_code,
         s.id IS NOT NULL AS submitted,
         s.grade, s.feedback, s.strengths, s.weaknesses, s.graded_at
       FROM course_assignments a
       JOIN courses c ON c.id = a.course_id
       JOIN course_enrollments e ON e.course_id = a.course_id AND e.student_id = $1
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
       ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getStudentAssignments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /instructors/me/assignments — instructor creates an assignment for a course
export async function createInstructorAssignment(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { course_id, title, description, due_date, file_url } = req.body;

  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isInstructor(userId))) { res.status(403).json({ error: "Instructor access only" }); return; }

  if (!course_id || !title?.trim()) {
    res.status(400).json({ error: "Course and title are required" });
    return;
  }

  try {
    const owns = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
      [course_id, userId],
    );
    if (owns.rows.length === 0) { res.status(403).json({ error: "You don't own this course" }); return; }

    const result = await pool.query(
      `INSERT INTO course_assignments (course_id, title, description, due_date, file_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [course_id, title.trim(), description?.trim() || null, due_date || null, file_url || null, userId],
    );
    const assignment = result.rows[0];
    const courseRes = await pool.query(`SELECT title FROM courses WHERE id = $1`, [course_id]);
    const courseTitle = courseRes.rows[0]?.title || "";
    const notifLink = `/dashboard/courses/${course_id}?assignment=${assignment.id}`;
    const notifStudents = await notifyCourseStudents(
      course_id, userId, "course_assignment",
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
    console.error("createInstructorAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
