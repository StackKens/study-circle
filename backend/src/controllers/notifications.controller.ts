import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { isUUID } from "../middleware/validate.middleware";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    const notifications = result.rows.map((n: any) => ({
      ...n,
      read: !!n.read,
    }));

    res.json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE user_id = $1 AND read = FALSE`,
      [userId],
    );

    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const notificationId = paramId(req.params.id);

  if (!isUUID(notificationId)) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  try {
    await pool.query(
      `UPDATE notifications SET read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    await pool.query(
      `UPDATE notifications SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
