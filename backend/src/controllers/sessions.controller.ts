import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createSession(req: AuthRequest, res: Response) {
  const { group_id, title, start_time, end_time } = req.body;
  const userId = req.user!.id;

  if (!group_id || !title || !start_time || !end_time) {
    res.status(400).json({ error: "group_id, title, start_time and end_time are required" });
    return;
  }

  try {
    // Verify user is an admin of the group
    const membership = await pool.query(
      `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, group_id]
    );
    if (membership.rows.length === 0) {
      res.status(403).json({ error: "You are not a member of this group" });
      return;
    }
    if (membership.rows[0].role !== "admin") {
      res.status(403).json({ error: "Only group admins can create sessions" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO sessions (group_id, title, start_time, end_time, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [group_id, title.trim(), start_time, end_time, userId]
    );

    const session = result.rows[0];

    // Fetch group_name and participant_count to match getMySessions shape
    const enriched = await pool.query(
      `SELECT s.*, g.name AS group_name,
        (SELECT COUNT(*) FROM session_attendees WHERE session_id = s.id) AS participant_count
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [session.id]
    );

    res.status(201).json(enriched.rows[0]);
  } catch (err) {
    console.error("createSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMySessions(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT s.*, g.name AS group_name,
        (SELECT COUNT(*) FROM session_attendees WHERE session_id = s.id) AS participant_count
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       JOIN group_members gm ON gm.group_id = s.group_id AND gm.user_id = $1
       ORDER BY s.start_time ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMySessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
