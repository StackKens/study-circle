import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { recommendGroupsForUser } from "../services/ai.service";
import { createNotification, notifyGroupMembers } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";

export async function createGroup(req: AuthRequest, res: Response) {
  const { name, subject, university, description } = req.body;
  const userId = req.user!.id;

  if (!name || !subject || !university) {
    res.status(400).json({ error: "name, subject and university are required" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO groups (name, subject, university, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), subject.trim(), university.trim(), description?.trim() || null, userId]
    );

    const group = result.rows[0];

    // Creator automatically becomes admin member
    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role) VALUES ($1, $2, 'admin')`,
      [userId, group.id]
    );

    const notif = await createNotification(
      userId, "group",
      "Group Created",
      `Your group "${group.name}" is ready. Invite members to join!`,
      `/dashboard/groups?focus=${group.id}`,
    );
    try { getIO().to(`user:${userId}`).emit("notification", notif); } catch {}

    res.status(201).json(group);
  } catch (err) {
    console.error("createGroup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyGroups(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyGroups error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getGroup(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT g.*,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members,
        gm.role
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
       WHERE g.id = $1`,
      [groupId, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getGroup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getGroupMembers(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = req.params.id;

  try {
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId],
    );

    if (membership.rows.length === 0) {
      res.status(403).json({ error: "You are not a member of this group" });
      return;
    }

    const result = await pool.query(
      `SELECT
        gm.user_id,
        gm.role,
        gm.joined_at,
        u.name,
        u.university,
        u.course,
        u.year_of_study,
        u.avatar_url
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY
        CASE WHEN gm.role = 'admin' THEN 0 ELSE 1 END,
        gm.joined_at ASC`,
      [groupId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getGroupMembers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function leaveGroup(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = req.params.id;

  try {
    // Prevent admin from leaving
    const adminCheck = await pool.query(
      `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId],
    );

    if (adminCheck.rows[0]?.role === "admin") {
      res.status(400).json({ error: "Admin cannot leave the group" });
      return;
    }

    await pool.query(
      `DELETE FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId],
    );

    res.status(200).json({ message: "Left group successfully" });
  } catch (err) {
    console.error("leaveGroup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getGroupRecommendations(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const userResult = await pool.query(
      `SELECT university, course, year_of_study FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const candidatesResult = await pool.query(
      `SELECT
        g.id,
        g.name,
        g.description,
        g.subject,
        g.university,
        g.created_at,
        COUNT(DISTINCT gm.user_id)::int AS total_members,
        COUNT(DISTINCT s.id)::int AS session_count,
        COUNT(DISTINCT r.id)::int AS resource_count
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       LEFT JOIN sessions s ON s.group_id = g.id
       LEFT JOIN resources r ON r.group_id = g.id
       WHERE NOT EXISTS (
         SELECT 1 FROM group_members my_groups
         WHERE my_groups.group_id = g.id AND my_groups.user_id = $1
       )
       GROUP BY g.id
       ORDER BY
         CASE
           WHEN LOWER(g.university) = LOWER($2) THEN 0
           ELSE 1
         END,
         g.created_at DESC
       LIMIT 25`,
      [userId, userResult.rows[0].university],
    );

    const recommendations = await recommendGroupsForUser(
      userResult.rows[0],
      candidatesResult.rows,
    );

    res.json(recommendations);
  } catch (err) {
    console.error("getGroupRecommendations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function joinGroup(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = req.params.id;

  try {
    const groupExists = await pool.query("SELECT id FROM groups WHERE id = $1", [
      groupId,
    ]);

    if (groupExists.rows.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (user_id, group_id) DO NOTHING`,
      [userId, groupId],
    );

    const result = await pool.query(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id = $1 AND gm.user_id = $2`,
      [groupId, userId],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("joinGroup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
