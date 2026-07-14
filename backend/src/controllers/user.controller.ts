import { Response, Request } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db/index";
import { isUUID, sanitizeString } from "../middleware/validate.middleware";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// Public endpoint — no auth required
export async function getHomeStats(req: Request, res: Response) {
  try {
    const [
      countResult,
      usersResult,
      universitiesResult,
      liveGroupResult,
      nextSessionResult,
      groupsCountResult,
      sessionsCountResult,
      resourcesCountResult,
      ongoingSessionsResult,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM users`),
      pool.query(
        `SELECT id, name, university, course, year_of_study, avatar_url
         FROM users ORDER BY created_at DESC LIMIT 5`
      ),
      pool.query(
        `SELECT DISTINCT university FROM users WHERE university IS NOT NULL AND university != '' ORDER BY university`
      ),
      pool.query(
        `SELECT g.name,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS member_count,
           (SELECT COUNT(*) FROM resources WHERE group_id = g.id)::int AS resource_count,
           (SELECT COUNT(*) FROM sessions WHERE group_id = g.id)::int AS session_count
         FROM groups g
         ORDER BY (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) DESC
         LIMIT 1`
      ),
      pool.query(
        `SELECT s.title, s.start_time,
           (SELECT COUNT(*) FROM session_attendees WHERE session_id = s.id)::int AS attendee_count
         FROM sessions s
         ORDER BY ABS(EXTRACT(EPOCH FROM (s.start_time - NOW())))
         LIMIT 1`
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM groups`),
      pool.query(`SELECT COUNT(*)::int AS count FROM sessions`),
      pool.query(`SELECT COUNT(*)::int AS count FROM resources`),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM sessions WHERE start_time <= NOW() AND end_time >= NOW()`
      ),
    ]);
    let testimonials = [];
    try {
      const testimonialsResult = await pool.query(
        `SELECT
           t.id,
           COALESCE(u.name, t.name) AS name,
           COALESCE(u.university, t.university) AS university,
           COALESCE(u.course, t.course) AS course,
           COALESCE(u.year_of_study, t.year_of_study) AS year_of_study,
           t.quote,
           t.rating,
           COALESCE(u.avatar_url, t.avatar_url) AS avatar_url
         FROM testimonials t
         LEFT JOIN users u ON u.id = t.user_id
         WHERE t.is_active = TRUE
         ORDER BY t.display_order ASC, t.created_at DESC`,
      );
      testimonials = testimonialsResult.rows;
    } catch (err) {
      console.error("getHomeStats testimonials error:", err);
    }

    const totalStudents = parseInt(countResult.rows[0].count, 10);
    const groupCount = parseInt(groupsCountResult.rows[0].count, 10);
    const sessionCount = parseInt(sessionsCountResult.rows[0].count, 10);
    const resourceCount = parseInt(resourcesCountResult.rows[0].count, 10);

    res.json({
      student_count: totalStudents,
      group_count: groupCount,
      session_count: sessionCount,
      resource_count: resourceCount,
      studying_now: ongoingSessionsResult.rows[0].count || 5,
      top_users: usersResult.rows,
      universities: universitiesResult.rows.map((r: { university: string }) => r.university),
      live_group: liveGroupResult.rows[0] || null,
      next_session: nextSessionResult.rows[0] || null,
      testimonials,
    });
  } catch (err) {
    console.error("getHomeStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Returns group count, session count, resource count, total study hours
export async function getUserStats(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const client = await pool.connect();
  try {
    const groupsCount = await client.query(
      "SELECT COUNT(*) FROM group_members WHERE user_id = $1",
      [userId],
    );
    const sessionsCount = await client.query(
      "SELECT COUNT(*) FROM session_attendees WHERE user_id = $1",
      [userId],
    );
    const resourcesCount = await client.query(
      "SELECT COUNT(*) FROM resources WHERE uploaded_by = $1",
      [userId],
    );
    const coursesCount = await client.query(
      "SELECT COUNT(*) FROM course_enrollments WHERE student_id = $1",
      [userId],
    );
    // Study hours: sum of (end_time - start_time) in hours for sessions attended
    const hoursResult = await client.query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours
       FROM session_attendees sa
       JOIN sessions s ON sa.session_id = s.id
       WHERE sa.user_id = $1`,
      [userId],
    );

    res.json({
      groups: parseInt(groupsCount.rows[0].count, 10),
      sessions: parseInt(sessionsCount.rows[0].count, 10),
      resources: parseInt(resourcesCount.rows[0].count, 10),
      studyHours: Math.round(hoursResult.rows[0].total_hours),
      enrolledCourses: parseInt(coursesCount.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  } finally {
    client.release();
  }
}

// Returns the user's groups (with optional limit)
export async function getUserGroups(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.subject, 
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as "memberCount"
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user groups:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
}

// Returns per-group stats: sessions count, resources count, members count, last session
export async function getUserProgress(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT
        g.id, g.name, g.subject, g.university,
        gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM sessions WHERE group_id = g.id) AS session_count,
        (SELECT COUNT(*) FROM resources WHERE group_id = g.id) AS resource_count,
        (SELECT MAX(start_time) FROM sessions WHERE group_id = g.id) AS last_session
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getUserProgress error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Currently returns an empty array (placeholder for future badge system)
export async function getUserBadges(req: AuthRequest, res: Response) {
  // TODO: implement badge logic when ready
  res.json([]);
}

// Returns the bio of a specific user (public)
export async function getUserBio(req: AuthRequest, res: Response) {
  const userId = paramId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: "User ID required" });
    return;
  }

  try {
    const result = await pool.query("SELECT bio FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ bio: result.rows[0].bio || "" });
  } catch (err) {
    console.error("Error fetching bio:", err);
    res.status(500).json({ error: "Failed to fetch bio" });
  }
}

export async function updateUserAvatar(req: AuthRequest, res: Response) {
  const authenticatedUserId = req.user?.id;
  const targetUserId = paramId(req.params.id);

  if (!isUUID(targetUserId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (!authenticatedUserId || authenticatedUserId !== targetUserId) {
    res.status(403).json({ error: "You can only update your own avatar" });
    return;
  }

  const { avatar_url } = req.body;
  if (!avatar_url) {
    res.status(400).json({ error: "avatar_url is required" });
    return;
  }

  // Only allow Cloudinary URLs — prevents SSRF and arbitrary URL storage
  const isValidAvatarUrl = (() => {
    try {
      const parsed = new URL(avatar_url);
      return (
        parsed.protocol === "https:" &&
        parsed.hostname === "res.cloudinary.com"
      );
    } catch {
      return false;
    }
  })();

  if (!isValidAvatarUrl) {
    res.status(400).json({ error: "avatar_url must be a valid Cloudinary URL (https://res.cloudinary.com/...)" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2
       RETURNING id, name, email, university, course, year_of_study, created_at, avatar_url`,
      [avatar_url, authenticatedUserId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateUserAvatar error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Updates the bio of the authenticated user (only own bio can be changed)
export async function updateUserBio(req: AuthRequest, res: Response) {
  const authenticatedUserId = req.user?.id;
  const targetUserId = paramId(req.params.id);

  if (!isUUID(targetUserId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (!authenticatedUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (authenticatedUserId !== targetUserId) {
    res.status(403).json({ error: "You can only update your own bio" });
    return;
  }

  const { bio } = req.body;
  if (bio === undefined) {
    res.status(400).json({ error: "bio field is required" });
    return;
  }

  try {
    await pool.query("UPDATE users SET bio = $1 WHERE id = $2", [
      bio,
      authenticatedUserId,
    ]);
    await pool.query(
      "UPDATE instructors SET bio = $1 WHERE user_id = $2",
      [bio, authenticatedUserId],
    );
    const userRes = await pool.query(
      `SELECT id, name, email, university, course, year_of_study, created_at, avatar_url,
              i.bio AS instructor_bio, i.department
       FROM users u
       LEFT JOIN instructors i ON i.user_id = u.id
       WHERE u.id = $1`,
      [authenticatedUserId],
    );
    res.json({ success: true, bio, user: userRes.rows[0] || null });
  } catch (err) {
    console.error("Error updating bio:", err);
    res.status(500).json({ error: "Failed to update bio" });
  }
}
