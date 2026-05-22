import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/friends — accepted friends with mutual group count
export async function getFriends(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.university, u.course, f.created_at AS since,
        (SELECT COUNT(*) FROM group_members gm1
         JOIN group_members gm2 ON gm1.group_id = gm2.group_id
         WHERE gm1.user_id = $1 AND gm2.user_id = u.id) AS mutual_groups
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/friends/requests — incoming pending requests
export async function getFriendRequests(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  try {
    const result = await pool.query(
      `SELECT f.user_id AS from_user_id, u.name AS from_user_name,
        u.email AS from_user_email, u.university, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getFriendRequests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/friends/search?q= — search users by name or email
export async function searchUsers(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const q = (req.query.q as string || "").trim();

  if (q.length < 2) {
    res.json([]);
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.university, u.course,
        (SELECT status FROM friendships
         WHERE (user_id = $1 AND friend_id = u.id)
            OR (user_id = u.id AND friend_id = $1)
         LIMIT 1) AS friendship_status
       FROM users u
       WHERE u.id != $1
         AND (u.name ILIKE $2 OR u.email ILIKE $2)
       LIMIT 10`,
      [userId, `%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/friends/request/:id — send friend request
export async function sendFriendRequest(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id: targetId } = req.params;

  if (userId === targetId) {
    res.status(400).json({ error: "You cannot send a request to yourself" });
    return;
  }

  try {
    const existing = await pool.query(
      `SELECT status FROM friendships
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, targetId]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Friend request already exists" });
      return;
    }

    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
      [userId, targetId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/friends/request/:id/accept
export async function acceptFriendRequest(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id: fromId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [fromId, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/friends/request/:id/decline
export async function declineFriendRequest(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id: fromId } = req.params;

  try {
    await pool.query(
      `UPDATE friendships SET status = 'declined'
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [fromId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("declineFriendRequest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/friends/:id — remove friend
export async function removeFriend(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id: friendId } = req.params;

  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("removeFriend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
