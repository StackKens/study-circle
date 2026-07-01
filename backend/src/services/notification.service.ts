import pool from "../db/index";

type NotificationType =
  | "session"
  | "resource"
  | "friend_request"
  | "group_recommendation"
  | "group"
  | "course"
  | "course_announcement"
  | "course_assignment"
  | "course_discussion"
  | "course_resource"
  | "private_message";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message, link || null],
  );
  return result.rows[0];
}

export async function notifyGroupMembers(
  groupId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const members = await pool.query(
    `SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2`,
    [groupId, excludeUserId],
  );

  for (const row of members.rows) {
    await createNotification(row.user_id, type, title, message, link);
  }

  return members.rows;
}

export async function notifyCourseStudents(
  courseId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const students = await pool.query(
    `SELECT student_id FROM course_enrollments WHERE course_id = $1 AND student_id != $2`,
    [courseId, excludeUserId],
  );

  for (const row of students.rows) {
    await createNotification(row.student_id, type, title, message, link);
  }

  return students.rows;
}
