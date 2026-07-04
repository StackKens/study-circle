import pool from "../db";

export function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function isInstructor(userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM instructors WHERE user_id = $1`,
    [userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
    [courseId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function canAccessCourse(
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
