import { Pool } from "pg";

const OLD_DB_URL = "postgresql://postgres:ENINPHLcAVuqmoCIIKUVKcDgwfhqvcOL@kodama.proxy.rlwy.net:56616/railway";
const NEW_DB_URL = "postgresql://postgres:GebgrxxkZLryNotALEBVgTsrxOKqfgVc@reseau.proxy.rlwy.net:23759/railway";

async function migrate() {
  console.log("Connecting to both databases...\n");

  const oldPool = new Pool({ connectionString: OLD_DB_URL, ssl: false });
  const newPool = new Pool({ connectionString: NEW_DB_URL, ssl: false });

  // Test connections
  await oldPool.query("SELECT 1");
  await newPool.query("SELECT 1");
  console.log("Both databases connected.\n");

  async function copyTable(
    label: string,
    table: string,
    columns: string,
    orderBy: string,
    conflict: string,
  ) {
    const { rows } = await oldPool.query(
      `SELECT ${columns} FROM ${table} ORDER BY ${orderBy}`
    );
    if (rows.length === 0) {
      console.log(`  ${label}: 0 rows (nothing to copy)`);
      return;
    }

    const colList = columns.split(", ").map((c) => `"${c}"`).join(", ");
    const placeholders = columns.split(", ").map((_, i) => `$${i + 1}`).join(", ");

    let copied = 0;
    for (const row of rows) {
      const vals = columns.split(", ").map((c) => row[c]);
      try {
        await newPool.query(
          `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ${conflict}`,
          vals
        );
        copied++;
      } catch (err: any) {
        console.log(`  ${label}: skipped row ${row.id || row.user_id || ""} — ${err.message.slice(0, 80)}`);
      }
    }
    console.log(`  ${label}: ${copied}/${rows.length} rows copied`);
  }

  // ── 1. USERS (preserve original UUIDs so FK refs stay intact) ───────────
  console.log("── Users ──");
  await copyTable(
    "users",
    "users",
    "id, name, email, password_hash, university, course, year_of_study, avatar_url, created_at",
    "created_at",
    'ON CONFLICT (email) DO NOTHING'
  );

  // ── 2. INSTRUCTORS ─────────────────────────────────────────────────────
  console.log("\n── Instructors ──");
  await copyTable(
    "instructors",
    "instructors",
    "user_id, bio, department, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 3. GROUPS ──────────────────────────────────────────────────────────
  console.log("\n── Groups ──");
  await copyTable(
    "groups",
    "groups",
    "id, name, description, subject, university, created_by, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 4. GROUP MEMBERS ───────────────────────────────────────────────────
  console.log("\n── Group members ──");
  await copyTable(
    "group_members",
    "group_members",
    "user_id, group_id, role, joined_at",
    "joined_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 5. SESSIONS ────────────────────────────────────────────────────────
  console.log("\n── Sessions ──");
  await copyTable(
    "sessions",
    "sessions",
    "id, group_id, title, start_time, end_time, created_by, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 6. SESSION ATTENDEES ───────────────────────────────────────────────
  console.log("\n── Session attendees ──");
  await copyTable(
    "session_attendees",
    "session_attendees",
    "session_id, user_id",
    "session_id",
    "ON CONFLICT DO NOTHING"
  );

  // ── 7. RESOURCES ───────────────────────────────────────────────────────
  console.log("\n── Resources ──");
  await copyTable(
    "resources",
    "resources",
    "id, group_id, title, type, url, uploaded_by, downloads, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 8. FRIENDSHIPS ─────────────────────────────────────────────────────
  console.log("\n── Friendships ──");
  await copyTable(
    "friendships",
    "friendships",
    "user_id, friend_id, status, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 9. MESSAGES (group chat) ──────────────────────────────────────────
  console.log("\n── Group messages ──");
  await copyTable(
    "messages",
    "messages",
    "id, group_id, sender_id, content, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 10. GENERAL MESSAGES ──────────────────────────────────────────────
  console.log("\n── General messages ──");
  await copyTable(
    "general_messages",
    "general_messages",
    "id, sender_id, content, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 11. PRIVATE MESSAGES ──────────────────────────────────────────────
  console.log("\n── Private messages ──");
  await copyTable(
    "private_messages",
    "private_messages",
    "id, sender_id, recipient_id, content, mentions, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 12. TESTIMONIALS ──────────────────────────────────────────────────
  console.log("\n── Testimonials ──");
  await copyTable(
    "testimonials",
    "testimonials",
    "id, user_id, name, university, course, year_of_study, quote, rating, avatar_url, display_order, is_active, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 13. COURSES ───────────────────────────────────────────────────────
  console.log("\n── Courses ──");
  await copyTable(
    "courses",
    "courses",
    "id, instructor_id, title, code, description, university, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 14. COURSE ENROLLMENTS ────────────────────────────────────────────
  console.log("\n── Course enrollments ──");
  await copyTable(
    "course_enrollments",
    "course_enrollments",
    "course_id, student_id, enrolled_at",
    "enrolled_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 15. COURSE ANNOUNCEMENTS ──────────────────────────────────────────
  console.log("\n── Course announcements ──");
  await copyTable(
    "course_announcements",
    "course_announcements",
    "id, course_id, author_id, title, content, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 16. COURSE RESOURCES ──────────────────────────────────────────────
  console.log("\n── Course resources ──");
  await copyTable(
    "course_resources",
    "course_resources",
    "id, course_id, title, type, url, uploaded_by, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 17. COURSE ASSIGNMENTS ────────────────────────────────────────────
  console.log("\n── Course assignments ──");
  await copyTable(
    "course_assignments",
    "course_assignments",
    "id, course_id, title, description, due_date, created_by, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 18. ASSIGNMENT SUBMISSIONS ────────────────────────────────────────
  console.log("\n── Assignment submissions ──");
  await copyTable(
    "assignment_submissions",
    "assignment_submissions",
    "assignment_id, student_id, content, url, submitted_at",
    "submitted_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 19. COURSE DISCUSSIONS ────────────────────────────────────────────
  console.log("\n── Course discussions ──");
  await copyTable(
    "course_discussions",
    "course_discussions",
    "id, course_id, author_id, title, content, is_answered, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 20. DISCUSSION REPLIES ────────────────────────────────────────────
  console.log("\n── Discussion replies ──");
  await copyTable(
    "course_discussion_replies",
    "course_discussion_replies",
    "id, discussion_id, author_id, content, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 21. NOTIFICATIONS ─────────────────────────────────────────────────
  console.log("\n── Notifications ──");
  await copyTable(
    "notifications",
    "notifications",
    "id, user_id, type, title, message, link, read, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 22. INSTRUCTOR FOLLOWERS ──────────────────────────────────────────
  console.log("\n── Instructor followers ──");
  await copyTable(
    "instructor_followers",
    "instructor_followers",
    "instructor_id, student_id, followed_at",
    "followed_at",
    "ON CONFLICT DO NOTHING"
  );

  // ── 23. EMAIL VERIFICATIONS ───────────────────────────────────────────
  console.log("\n── Email verifications ──");
  await copyTable(
    "email_verifications",
    "email_verifications",
    "token, user_id, expires_at, created_at",
    "created_at",
    "ON CONFLICT DO NOTHING"
  );

  await oldPool.end();
  await newPool.end();
  console.log("\n✅ Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
