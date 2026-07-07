import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { notifyGroupMembers } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";

function isValidMeetLink(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "meet.google.com" &&
      /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function createSession(req: AuthRequest, res: Response) {
  const { group_id, title, start_time, end_time, meet_link } = req.body;
  const userId = req.user!.id;

  if (!group_id || !title || !start_time || !end_time || !meet_link) {
    res
      .status(400)
      .json({
        error:
          "group_id, title, start_time, end_time and meet_link are required",
      });
    return;
  }

  const trimmedMeetLink = String(meet_link).trim();
  if (!isValidMeetLink(trimmedMeetLink)) {
    res.status(400).json({ error: "Enter a valid Google Meet link" });
    return;
  }

  try {
    // Verify user is an admin of the group
    const membership = await pool.query(
      `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, group_id],
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
      `INSERT INTO sessions (group_id, title, start_time, end_time, created_by, meet_link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [group_id, title.trim(), start_time, end_time, userId, trimmedMeetLink],
    );

    const session = result.rows[0];

    // Fetch group_name and participant_count to match getMySessions shape
    const enriched = await pool.query(
      `SELECT s.*, g.name AS group_name, s.meet_link,
        (SELECT COUNT(*) FROM session_attendees WHERE session_id = s.id) AS participant_count
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [session.id],
    );

    const s = enriched.rows[0];
    const startTime = new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const notifMembers = await notifyGroupMembers(
      group_id, userId, "session",
      "New Study Session",
      `A new session "${s.title}" in ${s.group_name} starts at ${startTime}.`,
      `/dashboard/sessions`,
    );
    const notif = { type: "session", title: "New Study Session", message: `A new session "${s.title}" in ${s.group_name} starts at ${startTime}.`, link: `/dashboard/sessions` };
    for (const m of notifMembers) {
      try { getIO().to(`user:${m.user_id}`).emit("notification", notif); } catch {}
    }

    res.status(201).json(s);
  } catch (err) {
    console.error("createSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function joinSession(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    // Session must exist and user must be a group member
    const session = await pool.query(
      `SELECT s.group_id, s.start_time, s.end_time FROM sessions s
       JOIN group_members gm ON gm.group_id = s.group_id AND gm.user_id = $1
       WHERE s.id = $2`,
      [userId, id],
    );
    if (session.rows.length === 0) {
      res
        .status(403)
        .json({ error: "Session not found or you are not a group member" });
      return;
    }

    const now = Date.now();
    const startTime = new Date(session.rows[0].start_time).getTime();
    const endTime = new Date(session.rows[0].end_time).getTime();

    if (now > endTime) {
      res.status(409).json({ error: "This session has already ended" });
      return;
    }

    // Insert — ignore if already joined
    await pool.query(
      `INSERT INTO session_attendees (session_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, userId],
    );

    const updated = await pool.query(
      `SELECT COUNT(*) AS participant_count FROM session_attendees WHERE session_id = $1`,
      [id],
    );

    // Fetch meet_link to send back so the frontend can open it
    const sessionLink = await pool.query(
      `SELECT meet_link, start_time, end_time FROM sessions WHERE id = $1`,
      [id],
    );

    res.json({
      joined: true,
      status: now < startTime ? "reserved" : "checked_in",
      participant_count: parseInt(updated.rows[0].participant_count, 10),
      meet_link: sessionLink.rows[0]?.meet_link || null,
    });
  } catch (err) {
    console.error("joinSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getSessionAttendees(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const membership = await pool.query(
      `SELECT 1 FROM sessions s
       JOIN group_members gm ON gm.group_id = s.group_id AND gm.user_id = $1
       WHERE s.id = $2 LIMIT 1`,
      [userId, id],
    );
    if (membership.rows.length === 0) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar_url FROM session_attendees sa
       JOIN users u ON u.id = sa.user_id
       WHERE sa.session_id = $1`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getSessionAttendees error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getRecentActivity(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    // Combine recent sessions + resources + group joins into one timeline
    const recentSessions = await pool.query(
      `SELECT 'session' AS type, s.title, g.name AS group_name, g.id AS group_id, s.created_at AS timestamp
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY s.created_at DESC LIMIT 5`,
      [userId],
    );

    const recentResources = await pool.query(
      `SELECT 'resource' AS type, r.title, g.name AS group_name, g.id AS group_id, r.created_at AS timestamp
       FROM resources r
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY r.created_at DESC LIMIT 5`,
      [userId],
    );

    const recentJoins = await pool.query(
      `SELECT 'join' AS type, g.name AS title, g.name AS group_name, g.id AS group_id, gm.joined_at AS timestamp
       FROM group_members gm
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY gm.joined_at DESC LIMIT 3`,
      [userId],
    );

    const combined = [
      ...recentSessions.rows,
      ...recentResources.rows,
      ...recentJoins.rows,
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    res.json(combined.slice(0, 10));
  } catch (err) {
    console.error("getRecentActivity error:", err);
    res.json([]);
  }
}

export async function getMySessions(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       JOIN group_members gm ON gm.group_id = s.group_id AND gm.user_id = $1`,
      [userId],
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT s.*, g.name AS group_name,
        (SELECT COUNT(*) FROM session_attendees WHERE session_id = s.id) AS participant_count,
        EXISTS (
          SELECT 1 FROM session_attendees sa
          WHERE sa.session_id = s.id AND sa.user_id = $1
        ) AS has_joined
       FROM sessions s
       JOIN groups g ON g.id = s.group_id
       JOIN group_members gm ON gm.group_id = s.group_id AND gm.user_id = $1
       ORDER BY s.start_time ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    res.json({ data: result.rows, total, page, limit });
  } catch (err) {
    console.error("getMySessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
