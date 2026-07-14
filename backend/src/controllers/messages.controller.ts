import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../db/index";
import { isUUID } from "../middleware/validate.middleware";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function conversationKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// GET /messages/conversations — list all DM threads for current user
export async function listConversations(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `WITH latest AS (
         SELECT DISTINCT ON (
           CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
           CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END
         )
           id, sender_id, recipient_id, content, created_at
         FROM private_messages
         WHERE sender_id = $1 OR recipient_id = $1
         ORDER BY
           CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
           CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END,
           created_at DESC
       )
       SELECT l.*,
         CASE WHEN l.sender_id = $1 THEN l.recipient_id ELSE l.sender_id END AS other_user_id,
         u.name AS other_user_name,
         u.avatar_url AS other_user_avatar,
         u.university AS other_user_university
       FROM latest l
       JOIN users u ON u.id = CASE WHEN l.sender_id = $1 THEN l.recipient_id ELSE l.sender_id END
       ORDER BY l.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("listConversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /messages/:userId — message history with a specific user
export async function getMessageHistory(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const otherId = paramId(req.params.userId);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isUUID(otherId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (userId === otherId) {
    res.status(400).json({ error: "Invalid conversation" });
    return;
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const result = await pool.query(
      `SELECT pm.*,
         s.name AS sender_name,
         s.avatar_url AS sender_avatar_url,
         s.university AS sender_university
       FROM private_messages pm
       JOIN users s ON s.id = pm.sender_id
       WHERE (pm.sender_id = $1 AND pm.recipient_id = $2)
          OR (pm.sender_id = $2 AND pm.recipient_id = $1)
       ORDER BY pm.created_at ASC
       LIMIT $3`,
      [userId, otherId, limit],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMessageHistory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /users/search?q= — search users for @mentions
export async function searchUsers(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const q = (req.query.q as string)?.trim();

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!q || q.length < 2) {
    res.json([]);
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, avatar_url, university, course
       FROM users
       WHERE id != $1 AND (name ILIKE $2 OR email ILIKE $2)
       ORDER BY name ASC
       LIMIT 10`,
      [userId, `%${q}%`],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export { conversationKey };
