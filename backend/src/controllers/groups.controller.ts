import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";

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
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS total_members
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
