import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { recommendResourcesForUser } from "../services/ai.service";
import { notifyGroupMembers } from "../services/notification.service";
import { getIO } from "../sockets/chat.socket";

export async function getResourceRecommendations(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  try {
    const profileResult = await pool.query(
      `SELECT university, course, year_of_study FROM users WHERE id = $1`,
      [userId]
    );
    if (profileResult.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }

    const candidatesResult = await pool.query(
      `SELECT r.id, r.title, r.type, r.url, r.downloads, g.subject, g.name AS group_name, u.name AS uploaded_by_name
       FROM resources r
       JOIN groups g ON g.id = r.group_id
       JOIN users u ON u.id = r.uploaded_by
       WHERE NOT EXISTS (
         SELECT 1 FROM group_members gm WHERE gm.group_id = r.group_id AND gm.user_id = $1
       )
       ORDER BY r.downloads DESC, r.created_at DESC
       LIMIT 25`,
      [userId]
    );

    const recommendations = await recommendResourcesForUser(profileResult.rows[0], candidatesResult.rows);
    res.json(recommendations);
  } catch (err) {
    console.error("getResourceRecommendations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function uploadResource(req: AuthRequest, res: Response) {
  const { group_id, title, type, url } = req.body;
  const userId = req.user!.id;

  if (!group_id || !title || !type || !url) {
    res.status(400).json({ error: "group_id, title, type and url are required" });
    return;
  }

  const validTypes = ["pdf", "link", "document"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "type must be one of: pdf, link, document. For videos, use type 'link' and paste a YouTube or Google Drive URL." });
    return;
  }

  try {
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, group_id]
    );
    if (membership.rows.length === 0) {
      res.status(403).json({ error: "You are not a member of this group" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO resources (group_id, title, type, url, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [group_id, title.trim(), type, url.trim(), userId]
    );

    const resource = result.rows[0];

    const enriched = await pool.query(
      `SELECT r.*, u.name AS uploaded_by_name, g.name AS group_name
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       JOIN groups g ON g.id = r.group_id
       WHERE r.id = $1`,
      [resource.id]
    );

    const r = enriched.rows[0];
    const notifMembers = await notifyGroupMembers(
      group_id, userId, "resource",
      "New Resource",
      `${r.uploaded_by_name} shared "${r.title}" in ${r.group_name}.`,
      `/dashboard/resources`,
    );
    const notif = { type: "resource", title: "New Resource", message: `${r.uploaded_by_name} shared "${r.title}" in ${r.group_name}.`, link: `/dashboard/resources` };
    for (const m of notifMembers) {
      try { getIO().to(`user:${m.user_id}`).emit("notification", notif); } catch {}
    }

    res.status(201).json(r);
  } catch (err) {
    console.error("uploadResource error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllResources(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM resources r
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = r.group_id AND gm.user_id = $1`,
      [userId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT r.*, u.name AS uploaded_by_name, g.name AS group_name, g.subject
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = r.group_id AND gm.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    res.json({ data: result.rows, total, page, limit });
  } catch (err) {
    console.error("getAllResources error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function incrementDownload(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE resources SET downloads = downloads + 1 WHERE id = $1 RETURNING downloads`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    res.json({ downloads: result.rows[0].downloads });
  } catch (err) {
    console.error("incrementDownload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyResources(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM resources r
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = r.group_id AND gm.user_id = $1`,
      [userId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT r.*, u.name AS uploaded_by_name, g.name AS group_name
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = r.group_id AND gm.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ data: result.rows, total, page, limit });
  } catch (err) {
    console.error("getMyResources error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
