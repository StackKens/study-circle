import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    // Run all queries in parallel
    const [upcomingSessions, newResources, friendRequests, pendingRecs] = await Promise.all([
      // Sessions in the next 24hrs in groups the user is in
      pool.query(
        `SELECT s.id, s.title, s.start_time, g.name AS group_name, g.id AS group_id
         FROM sessions s
         JOIN groups g ON g.id = s.group_id
         JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
         WHERE s.start_time BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
         ORDER BY s.start_time ASC
         LIMIT 5`,
        [userId]
      ),

      // Resources uploaded in the last 48hrs in groups the user is in
      pool.query(
        `SELECT r.id, r.title, r.type, g.name AS group_name, g.id AS group_id, u.name AS uploader
         FROM resources r
         JOIN groups g ON g.id = r.group_id
         JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
         JOIN users u ON u.id = r.uploaded_by
         WHERE r.uploaded_by != $1
           AND r.created_at >= NOW() - INTERVAL '48 hours'
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [userId]
      ),

      // Pending friend requests
      pool.query(
        `SELECT f.user_id, u.name, u.university, u.course
         FROM friendships f
         JOIN users u ON u.id = f.user_id
         WHERE f.friend_id = $1 AND f.status = 'pending'
         ORDER BY f.created_at DESC
         LIMIT 3`,
        [userId]
      ),

      // Top 2 AI group recommendations not yet joined
      pool.query(
        `SELECT g.id, g.name, g.subject,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
         FROM groups g
         WHERE NOT EXISTS (
           SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1
         )
         ORDER BY member_count DESC
         LIMIT 2`,
        [userId]
      ),
    ]);

    const notifications: {
      id: string;
      type: string;
      title: string;
      message: string;
      link: string;
      created_at: string;
    }[] = [];

    // Upcoming sessions
    for (const s of upcomingSessions.rows) {
      const time = new Date(s.start_time).toLocaleTimeString(undefined, {
        hour: "numeric", minute: "2-digit",
      });
      notifications.push({
        id: `session-${s.id}`,
        type: "session",
        title: "Upcoming Session",
        message: `"${s.title}" in ${s.group_name} starts today at ${time}. Don't miss it.`,
        link: `/dashboard/sessions`,
        created_at: s.start_time,
      });
    }

    // New resources
    for (const r of newResources.rows) {
      notifications.push({
        id: `resource-${r.id}`,
        type: "resource",
        title: "New Resource Shared",
        message: `${r.uploader} shared "${r.title}" (${r.type}) in ${r.group_name}.`,
        link: `/dashboard/resources`,
        created_at: new Date().toISOString(),
      });
    }

    // Friend requests
    for (const f of friendRequests.rows) {
      notifications.push({
        id: `friend-${f.user_id}`,
        type: "friend_request",
        title: "Friend Request",
        message: `${f.name} from ${f.university} wants to connect. They study ${f.course}.`,
        link: `/dashboard/friends`,
        created_at: new Date().toISOString(),
      });
    }

    // Group recommendations
    for (const g of pendingRecs.rows) {
      notifications.push({
        id: `rec-${g.id}`,
        type: "group_recommendation",
        title: "Recommended Group",
        message: `"${g.name}" (${g.subject}) has ${g.member_count} active members and matches your profile.`,
        link: `/dashboard/groups`,
        created_at: new Date().toISOString(),
      });
    }

    res.json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
