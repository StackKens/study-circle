import pool from "./index";
import bcrypt from "bcryptjs";
import { initDatabase } from "./init";

const AVATAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

const UNIVERSITIES = [
  "University of Lagos",
  "Obafemi Awolowo University",
  "University of Ibadan",
  "Ahmadu Bello University",
  "University of Nigeria, Nsukka",
  "Lagos State University",
  "Federal University of Technology, Akure",
  "Covenant University",
  "Babcock University",
  "University of Benin",
];

const COURSES = [
  "Computer Science",
  "Medicine and Surgery",
  "Law",
  "Business Administration",
  "Mechanical Engineering",
  "Economics",
  "Political Science",
  "Accounting",
  "Mass Communication",
  "Pharmacy",
  "Architecture",
  "Biochemistry",
  "Electrical Engineering",
  "Civil Engineering",
  "English Language",
];

const GROUP_NAMES = [
  "CS 301 Study Group",
  "Medicine Tutorials",
  "Law Review Circle",
  "Engineering Mathematics",
  "Economics Discussion Forum",
  "Organic Chemistry Study",
  "Physics Problem Solvers",
  "Statistics Workshop",
  "Anatomy Study Group",
  "Business Case Study Team",
];

const GROUP_SUBJECTS = [
  "Computer Science",
  "Medicine",
  "Law",
  "Engineering",
  "Economics",
  "Chemistry",
  "Physics",
  "Statistics",
  "Anatomy",
  "Business",
];

const YEAR_STUDY = [1, 2, 3, 4, 5];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

async function seed() {
  console.log("Seeding database...\n");

  await initDatabase();
  console.log("");

  const passwordHash = await bcrypt.hash("password123", 10);

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  const adminResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, university, course, year_of_study, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Admin User", "admin@studycircle.app", passwordHash, "University of Lagos", "Administration", 1, `${AVATAR_BASE}admin`]
  );
  const adminId = adminResult.rows[0].id;
  console.log(`  ✓ Admin: admin@studycircle.app / password123`);

  const studentNames = [
    "Chioma Okafor", "Emeka Nwosu", "Aisha Bello", "Tunde Balogun", "Yetunde Adebayo",
    "Chidi Okonkwo", "Funmi Ogunleye", "Ibrahim Danjuma", "Ngozi Eze", "Oluwaseun Ajayi",
    "Kelechi Nwachukwu", "Ruth Akpan", "Segun Olaoye", "Temitope Adeyemi", "Uche Obi",
    "Zainab Yusuf", "Chigozie Nnamdi", "Folake Ajayi", "Ifeanyi Okoro", "Kemi Adegoke",
    "Musa Bello", "Nkechi Okeke", "Obinna Eze", "Patience Udoh", "Rotimi Akinlade",
    "Sade Ogunlade", "Tobi Adeleke", "Yemi Oni", "Amara Okafor", "Babatunde Ojo",
  ];

  const userIds: string[] = [];

  for (const name of studentNames) {
    const email = name.toLowerCase().replace(/\s+/g, ".") + "@student.edu";
    const university = pick(UNIVERSITIES);
    const course = pick(COURSES);
    const year = pick(YEAR_STUDY);
    const avatarSeed = name.replace(/\s+/g, "").toLowerCase();

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, university, course, year_of_study, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, email, passwordHash, university, course, year, `${AVATAR_BASE}${avatarSeed}`]
    );
    userIds.push(result.rows[0].id);
  }
  console.log(`  ✓ ${studentNames.length} students created (password: password123)`);

  // ── 2. INSTRUCTORS ────────────────────────────────────────────────────────
  const instructorUsers = userIds.slice(0, 5);
  for (const userId of instructorUsers) {
    await pool.query(
      `INSERT INTO instructors (user_id, bio, department)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio`,
      [userId, "Experienced lecturer and researcher.", pick(COURSES)]
    );
  }
  console.log("  ✓ 5 instructors created");

  // ── 3. GROUPS ─────────────────────────────────────────────────────────────
  const groupIds: string[] = [];
  for (let i = 0; i < GROUP_NAMES.length; i++) {
    const creatorId = pick(userIds);
    const result = await pool.query(
      `INSERT INTO groups (name, description, subject, university, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [GROUP_NAMES[i], `A study group for ${GROUP_SUBJECTS[i]} students.`, GROUP_SUBJECTS[i], pick(UNIVERSITIES), creatorId]
    );
    if (result.rows.length > 0) groupIds.push(result.rows[0].id);
  }
  console.log(`  ✓ ${groupIds.length} groups created`);

  // ── 4. GROUP MEMBERS ──────────────────────────────────────────────────────
  for (const groupId of groupIds) {
    const members = pickN(userIds, 6 + Math.floor(Math.random() * 8));
    for (const userId of members) {
      await pool.query(
        `INSERT INTO group_members (user_id, group_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [userId, groupId, Math.random() < 0.2 ? "admin" : "member"]
      );
    }
  }
  console.log("  ✓ Group memberships added");

  // ── 5. SESSIONS ───────────────────────────────────────────────────────────
  for (const groupId of groupIds) {
    const numSessions = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSessions; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14));
      startDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1 + Math.floor(Math.random() * 2));

      const sessionResult = await pool.query(
        `INSERT INTO sessions (group_id, title, start_time, end_time, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [groupId, `Session ${i + 1}: ${pick(["Introduction", "Review", "Problem Solving", "Discussion", "Revision"])}`, startDate, endDate, pick(userIds)]
      );

      // Add random attendees
      const attendees = pickN(userIds, 3 + Math.floor(Math.random() * 7));
      for (const userId of attendees) {
        await pool.query(
          `INSERT INTO session_attendees (session_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [sessionResult.rows[0].id, userId]
        );
      }
    }
  }
  console.log("  ✓ Sessions created with attendees");

  // ── 6. RESOURCES ──────────────────────────────────────────────────────────
  const resourceTypes = ["pdf", "link", "video", "document"];
  const resourceTitles = [
    "Lecture Notes Week 1", "Study Guide", "Past Questions", "Reading List",
    "Lab Manual", "Assignment Sheet", "Reference Material", "Summary Notes",
  ];
  for (const groupId of groupIds) {
    const numResources = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numResources; i++) {
      await pool.query(
        `INSERT INTO resources (group_id, title, type, url, uploaded_by, downloads)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [groupId, pick(resourceTitles), pick(resourceTypes), `https://example.com/resource/${groupId}/${i}`, pick(userIds), Math.floor(Math.random() * 50)]
      );
    }
  }
  console.log("  ✓ Resources created");

  // ── 7. PRIVATE MESSAGES ───────────────────────────────────────────────────
  for (let i = 0; i < 20; i++) {
    const senderId = pick(userIds);
    let recipientId = pick(userIds);
    while (recipientId === senderId) recipientId = pick(userIds);

    await pool.query(
      `INSERT INTO private_messages (sender_id, recipient_id, content, created_at)
       VALUES ($1, $2, $3, NOW() - interval '${Math.floor(Math.random() * 72)} hours')`,
      [senderId, recipientId, pick([
        "Hey, have you started the assignment?",
        "Can we study together tomorrow?",
        "Did you see the lecture notes?",
        "Sure, let's meet at the library.",
        "Thanks for the help yesterday!",
        "What time is the session?",
        "I'm stuck on question 3, any ideas?",
        "Great session today!",
        "Can you share the notes with me?",
        "Let me know when you're free.",
      ])]
    );
  }
  console.log("  ✓ Private messages created");

  // ── 8. COURSES ────────────────────────────────────────────────────────────
  const courseIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const instructorId = instructorUsers[i % instructorUsers.length];
    const result = await pool.query(
      `INSERT INTO courses (instructor_id, title, code, description, university)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [instructorId, `${COURSES[i]} 101`, `${COURSES[i].substring(0, 4).toUpperCase()}101`, `Introduction to ${COURSES[i]}`, pick(UNIVERSITIES)]
    );
    if (result.rows.length > 0) courseIds.push(result.rows[0].id);
  }
  console.log(`  ✓ ${courseIds.length} courses created`);

  // ── 9. COURSE ENROLLMENTS ─────────────────────────────────────────────────
  for (const courseId of courseIds) {
    const students = pickN(userIds, 8 + Math.floor(Math.random() * 10));
    for (const studentId of students) {
      await pool.query(
        `INSERT INTO course_enrollments (course_id, student_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [courseId, studentId]
      );
    }
  }
  console.log("  ✓ Course enrollments added");

  // ── 10. FRIENDSHIPS ───────────────────────────────────────────────────────
  for (let i = 0; i < 15; i++) {
    const user1 = pick(userIds);
    let user2 = pick(userIds);
    while (user2 === user1) user2 = pick(userIds);

    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [user1, user2, pick(["pending", "accepted", "accepted"])]
    );
  }
  console.log("  ✓ Friendships created");

  // ── 11. TESTIMONIALS ──────────────────────────────────────────────────────
  const testimonialQuotes = [
    "StudyCircle has completely transformed how I prepare for exams. The study groups are amazing!",
    "I found my best study partner through this platform. Highly recommended!",
    "The resources shared by other students are incredibly helpful. This platform is a game-changer!",
    "Being able to connect with students from different universities has broadened my perspective.",
    "The group sessions helped me improve my grades significantly. Thank you StudyCircle!",
    "I love how easy it is to find people studying the same course as me.",
    "This platform made remote learning so much more interactive and engaging.",
    "The study materials and past questions shared here are invaluable.",
  ];
  for (let i = 0; i < 8; i++) {
    const user = await pool.query(`SELECT id, name, university, course, year_of_study, avatar_url FROM users ORDER BY RANDOM() LIMIT 1`);
    const u = user.rows[0];
    await pool.query(
      `INSERT INTO testimonials (user_id, name, university, course, year_of_study, quote, rating, avatar_url, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       ON CONFLICT (name, quote) DO NOTHING`,
      [u.id, u.name, u.university, u.course, u.year_of_study, testimonialQuotes[i], 4 + Math.floor(Math.random() * 2), u.avatar_url, i + 1]
    );
  }
  console.log("  ✓ Testimonials created");

  // ── 12. GENERAL CHAT MESSAGES ─────────────────────────────────────────────
  const chatMessages = [
    "Hello everyone! 👋",
    "Good morning! Hope you're all having a productive day.",
    "Does anyone have notes for today's lecture?",
    "I just uploaded some resources for the upcoming exam.",
    "Can someone explain the concept of polymorphism?",
    "There's a study session at the library at 3pm today.",
    "Has anyone started the group project yet?",
    "Thanks for the help with yesterday's assignment!",
    "What's everyone's schedule looking like this weekend?",
    "I found a great YouTube channel for this topic.",
  ];
  for (const content of chatMessages) {
    await pool.query(
      `INSERT INTO general_messages (sender_id, content, created_at)
       VALUES ($1, $2, NOW() - interval '${Math.floor(Math.random() * 48)} hours')`,
      [pick(userIds), content]
    );
  }
  console.log("  ✓ General chat messages created");

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Database seeded successfully!");
  console.log(`   ${studentNames.length} users, ${groupIds.length} groups, ${courseIds.length} courses`);
  console.log("   All users use password: password123\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
