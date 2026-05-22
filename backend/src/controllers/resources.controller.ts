import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { recommendResourcesForUser } from "../services/ai.service";

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

  const validTypes = ["pdf", "link", "video", "document"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "type must be one of: pdf, link, video, document" });
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

    res.status(201).json(enriched.rows[0]);
  } catch (err) {
    console.error("uploadResource error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllResources(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS uploaded_by_name, g.name AS group_name, g.subject
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       JOIN groups g ON g.id = r.group_id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
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

  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS uploaded_by_name, g.name AS group_name
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       JOIN groups g ON g.id = r.group_id
       JOIN group_members gm ON gm.group_id = r.group_id AND gm.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyResources error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
