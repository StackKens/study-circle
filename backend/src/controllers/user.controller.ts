import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db/index";

// GET /api/users/me/stats
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
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  } finally {
    client.release();
  }
}

// GET /api/users/me/groups?limit=3
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

// GET /api/users/me/badges
// Currently returns an empty array (placeholder for future badge system)
export async function getUserBadges(req: AuthRequest, res: Response) {
  // TODO: implement badge logic when ready
  res.json([]);
}

// GET /api/users/:id/bio
// Returns the bio of a specific user (public)
export async function getUserBio(req: AuthRequest, res: Response) {
  const userId = req.params.id;
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

// PATCH /api/users/:id/bio
// Updates the bio of the authenticated user (only own bio can be changed)
export async function updateUserBio(req: AuthRequest, res: Response) {
  const authenticatedUserId = req.user?.id;
  const targetUserId = req.params.id;

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
    res.json({ success: true, bio });
  } catch (err) {
    console.error("Error updating bio:", err);
    res.status(500).json({ error: "Failed to update bio" });
  }
}
