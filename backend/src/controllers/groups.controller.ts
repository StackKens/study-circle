import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { recommendGroupsForUser } from "../services/ai.service";
import { getCached, setCache } from "../utils/cache";
import { createNotification, notifyGroupMembers } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";
import { isUUID, sanitizeString } from "../middleware/validate.middleware";
import crypto from "crypto";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function createGroup(req: AuthRequest, res: Response) {
  const { name, subject, description, is_private } = req.body;
  const userId = req.user!.id;

  const trimmedName = sanitizeString(name, 80);
  const trimmedSubject = sanitizeString(subject, 80);

  if (!trimmedName || !trimmedSubject) {
    res.status(400).json({ error: "name and subject are required" });
    return;
  }

  try {
    // Fetch the user's university from their profile — don't trust the client
    const userRes = await pool.query(
      `SELECT university FROM users WHERE id = $1`,
      [userId],
    );
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const university = userRes.rows[0].university;

    const result = await pool.query(
      `INSERT INTO groups (name, subject, university, description, created_by, is_private)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [trimmedName, trimmedSubject, university, sanitizeString(description, 500) || null, userId, Boolean(is_private)]
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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1`,
      [userId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ data: result.rows, total, page, limit });
  } catch (err) {
    console.error("getMyGroups error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getGroup(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = paramId(req.params.id);

  if (!isUUID(groupId)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

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
  const groupId = paramId(req.params.id);

  if (!isUUID(groupId)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

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
  const groupId = paramId(req.params.id);

  if (!isUUID(groupId)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

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
       AND g.is_private = FALSE
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

    const cacheKey = `group-recs:${userId}`;
    let recommendations = getCached<Awaited<ReturnType<typeof recommendGroupsForUser>>>(cacheKey);
    if (!recommendations) {
      recommendations = await recommendGroupsForUser(
        userResult.rows[0],
        candidatesResult.rows,
      );
      setCache(cacheKey, recommendations);
    }

    res.json(recommendations);
  } catch (err) {
    console.error("getGroupRecommendations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function joinGroup(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = paramId(req.params.id);

  if (!isUUID(groupId)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  try {
    const groupExists = await pool.query("SELECT id, is_private FROM groups WHERE id = $1", [
      groupId,
    ]);

    if (groupExists.rows.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Private groups can only be joined via invite link
    if (groupExists.rows[0].is_private) {
      res.status(403).json({ error: "This group is private. You need an invite link to join." });
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

// ── Generate an invite link for a group (admin only)
export async function generateInviteLink(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const groupId = paramId(req.params.id);

  if (!isUUID(groupId)) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }

  try {
    // Only admins can generate invite links
    const membership = await pool.query(
      `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );
    if (membership.rows.length === 0) {
      res.status(403).json({ error: "You are not a member of this group" });
      return;
    }
    if (membership.rows[0].role !== "admin") {
      res.status(403).json({ error: "Only group admins can generate invite links" });
      return;
    }

    // Reuse existing non-expired token for this group if one exists
    const existing = await pool.query(
      `SELECT token FROM group_invite_tokens
       WHERE group_id = $1 AND created_by = $2
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      [groupId, userId]
    );

    if (existing.rows.length > 0) {
      const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${existing.rows[0].token}`;
      res.json({ token: existing.rows[0].token, invite_url: inviteUrl });
      return;
    }

    // Generate a new token
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO group_invite_tokens (group_id, token, created_by)
       VALUES ($1, $2, $3)`,
      [groupId, token, userId]
    );

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${token}`;
    res.status(201).json({ token, invite_url: inviteUrl });
  } catch (err) {
    console.error("generateInviteLink error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── Accept an invite link and join the group
export async function acceptInvite(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { token } = req.params;

  try {
    const inviteRes = await pool.query(
      `SELECT git.*, g.name AS group_name, g.is_private
       FROM group_invite_tokens git
       JOIN groups g ON g.id = git.group_id
       WHERE git.token = $1`,
      [token]
    );

    if (inviteRes.rows.length === 0) {
      res.status(404).json({ error: "Invalid or expired invite link" });
      return;
    }

    const invite = inviteRes.rows[0];

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      res.status(410).json({ error: "This invite link has expired" });
      return;
    }

    // Check max uses
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      res.status(410).json({ error: "This invite link has reached its maximum uses" });
      return;
    }

    // Already a member? Just return the group
    const alreadyMember = await pool.query(
      `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, invite.group_id]
    );
    if (alreadyMember.rows.length > 0) {
      const groupRes = await pool.query(
        `SELECT g.*, gm.role,
          (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
         WHERE g.id = $1 AND gm.user_id = $2`,
        [invite.group_id, userId]
      );
      res.json({ already_member: true, group: groupRes.rows[0] });
      return;
    }

    // Join the group
    await pool.query(
      `INSERT INTO group_members (user_id, group_id, role)
       VALUES ($1, $2, 'member')`,
      [userId, invite.group_id]
    );

    // Increment use count
    await pool.query(
      `UPDATE group_invite_tokens SET use_count = use_count + 1 WHERE token = $1`,
      [token]
    );

    const groupRes = await pool.query(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS total_members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id = $1 AND gm.user_id = $2`,
      [invite.group_id, userId]
    );

    res.status(201).json({ already_member: false, group: groupRes.rows[0] });
  } catch (err) {
    console.error("acceptInvite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
