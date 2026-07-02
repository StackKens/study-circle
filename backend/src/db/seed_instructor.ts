import pool from "./index";
import bcrypt from "bcryptjs";

async function seedInstructor() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await pool.query(
    `INSERT INTO users (name, email, password_hash, university, course, year_of_study)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [
      "Dr. John Doe",
      "instructor@studycircle.app",
      passwordHash,
      "University of Lagos",
      "Computer Science",
      1,
    ],
  );
  const instructorId = user.rows[0].id;

  await pool.query(
    `INSERT INTO instructors (user_id, bio, department)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio`,
    [
      instructorId,
      "Senior lecturer in Computer Science with 10 years experience.",
      "Computer Science",
    ],
  );

  const course = await pool.query(
    `INSERT INTO courses (instructor_id, title, code, description, university)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      instructorId,
      "Introduction to Programming",
      "CS101",
      "A beginner-friendly course covering Python, data structures, and algorithms.",
      "University of Lagos",
    ],
  );
  const courseId = course.rows[0].id;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  await pool.query(
    `INSERT INTO course_assignments (course_id, title, description, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [
      courseId,
      "Python Basics Assignment",
      "Write a Python program that implements a simple calculator with add, subtract, multiply, and divide functions. Include error handling for division by zero.",
      dueDate,
      instructorId,
    ],
  );

  const student = await pool.query(
    `INSERT INTO users (name, email, password_hash, university, course, year_of_study)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [
      "Alex Student",
      "student@studycircle.app",
      passwordHash,
      "University of Lagos",
      "Computer Science",
      2,
    ],
  );
  const studentId = student.rows[0].id;

  await pool.query(
    `INSERT INTO course_enrollments (course_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [courseId, studentId],
  );

  console.log("  ✅ Instructor created:");
  console.log(`     Email:    instructor@studycircle.app`);
  console.log(`     Password: password123`);
  console.log("");
  console.log("  ✅ Student created (auto-enrolled in course):");
  console.log(`     Email:    student@studycircle.app`);
  console.log(`     Password: password123`);
  console.log("");
  console.log(`Course: Introduction to Programming (CS101)`);
  console.log(`Assignment: Python Basics Assignment (due in 7 days)`);

  await pool.end();
}

seedInstructor().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
