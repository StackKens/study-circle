import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import pool from "../db/index";

//  Types

interface AuthPayload {
  id: string;
  email: string;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  user?: AuthPayload;
}

interface SendMessagePayload {
  group_id: string;
  content: string;
}

interface JoinRoomPayload {
  group_id: string;
}

// ─── Helpers

/**
 * Verify the socket is authenticated via JWT in handshake auth.
 * Returns the decoded payload or throws.
 */
function verifyToken(token: string): AuthPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, secret) as AuthPayload;
}

/**
 * Check the user is actually a member of the group.
 * This is the authorization gate — knowing a group_id is not enough.
 */
async function isGroupMember(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2`,
    [userId, groupId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Persist a message and return the full row with sender info.
 */
async function saveMessage(groupId: string, senderId: string, content: string) {
  const result = await pool.query(
    `INSERT INTO messages (group_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING
       id,
       group_id,
       sender_id,
       content,
       created_at`,
    [groupId, senderId, content],
  );
  return result.rows[0];
}

/**
 * Fetch the last N messages for a group, newest last (for rendering top→bottom).
 */
async function getRecentMessages(groupId: string, limit = 50) {
  const result = await pool.query(
    `SELECT
       m.id,
       m.group_id,
       m.content,
       m.created_at,
       m.sender_id,
       u.name AS sender_name,
       u.university AS sender_university,
       u.avatar_url AS sender_avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.group_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2`,
    [groupId, limit],
  );
  // Reverse so oldest is first — ready for the UI to render top→bottom
  return result.rows.reverse();
}

// ─── General Chat (platform-wide)

/**
 * Persist a general chat message.
 */
async function saveGeneralMessage(senderId: string, content: string) {
  const result = await pool.query(
    `INSERT INTO general_messages (sender_id, content)
     VALUES ($1, $2)
     RETURNING id, sender_id, content, created_at`,
    [senderId, content],
  );
  return result.rows[0];
}

/**
 * Fetch the last N general messages, newest last (for rendering top→bottom).
 */
async function getRecentGeneralMessages(limit = 50) {
  const result = await pool.query(
    `SELECT
       gm.id,
       gm.content,
       gm.created_at,
       gm.sender_id,
       u.name AS sender_name,
       u.university AS sender_university,
       u.avatar_url AS sender_avatar_url
     FROM general_messages gm
     JOIN users u ON u.id = gm.sender_id
     ORDER BY gm.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.reverse();
}

/**
 * Auto-create the general_messages table if it doesn't exist yet.
 */
async function ensureGeneralTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_general_messages_created
        ON general_messages(created_at DESC)
    `);
  } catch (err) {
    console.error("[chat] failed to ensure general_messages table", err);
  }
}

// ─── Engine

export function initChat(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://studycircle-2026.netlify.app"
          : /^http:\/\/localhost:\d+$/,
      credentials: true,
    },
    // Useful for students on spotty connections — try WebSocket first,
    // fall back to polling if university firewalls block it
    transports: ["websocket", "polling"],
  });

  // ── Auth middleware — runs before any event, rejects unauthenticated sockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("AUTH_REQUIRED"));
    }

    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error("AUTH_INVALID"));
    }
  });

  // ── Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[chat] connected: ${user.name} (${user.id})`);

    // ── join_room
    // Client sends this when opening a group's chat tab.
    // We verify membership before letting them in.
    socket.on("join_room", async ({ group_id }: JoinRoomPayload) => {
      if (!group_id) {
        socket.emit("error", { message: "group_id required" });
        return;
      }

      const allowed = await isGroupMember(user.id, group_id).catch(() => false);
      if (!allowed) {
        socket.emit("error", { message: "Not a member of this group" });
        return;
      }

      const room = `group:${group_id}`;

      // Leave any previous room (one active chat at a time per socket)
      const currentRooms = [...socket.rooms].filter((r) => r !== socket.id);
      for (const r of currentRooms) {
        socket.leave(r);
      }

      socket.join(room);

      // Send message history so the UI isn't empty on load
      try {
        const history = await getRecentMessages(group_id);
        socket.emit("message_history", history);
      } catch (err) {
        console.error("[chat] failed to load history", err);
        socket.emit("message_history", []);
      }

      console.log(`[chat] ${user.name} joined room ${room}`);
    });

    // ── send_message
    // Client sends { group_id, content }.
    // Server validates, saves, then broadcasts to everyone in the room.
    socket.on(
      "send_message",
      async ({ group_id, content }: SendMessagePayload) => {
        if (!group_id || !content?.trim()) {
          socket.emit("error", { message: "group_id and content required" });
          return;
        }

        const trimmed = content.trim();

        if (trimmed.length > 2000) {
          socket.emit("error", {
            message: "Message too long (max 2000 chars)",
          });
          return;
        }

        // Re-check membership on every message — membership can change
        const allowed = await isGroupMember(user.id, group_id).catch(
          () => false,
        );
        if (!allowed) {
          socket.emit("error", { message: "Not a member of this group" });
          return;
        }

        try {
          // Fetch fresh user details from DB to ensure avatar/name updates are instant
          const userRes = await pool.query(
            "SELECT name, university, avatar_url FROM users WHERE id = $1",
            [user.id]
          );
          const freshUser = userRes.rows[0] || user;

          const saved = await saveMessage(group_id, user.id, trimmed);

          const outgoing = {
            ...saved,
            sender_name: freshUser.name,
            sender_university: freshUser.university ?? "",
            sender_avatar_url: freshUser.avatar_url ?? null,
          };

          // Broadcast to all sockets in the room, including the sender
          // so the sender's UI confirms the message was saved
          io.to(`group:${group_id}`).emit("receive_message", outgoing);
        } catch (err) {
          console.error("[chat] failed to save message", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    // ── GENERAL CHAT EVENTS
    // No room needed — joining is implicit. All authenticated users participate.

    // ensure the table exists on first connection
    ensureGeneralTable();

    socket.on("general_message_history", async () => {
      try {
        const history = await getRecentGeneralMessages();
        socket.emit("general_message_history", history);
      } catch (err) {
        console.error("[chat] failed to load general history", err);
        socket.emit("general_message_history", []);
      }
    });

    socket.on(
      "send_general_message",
      async ({ content }: { content: string }) => {
        if (!content?.trim()) {
          socket.emit("error", { message: "content required" });
          return;
        }

        const trimmed = content.trim();

        if (trimmed.length > 2000) {
          socket.emit("error", {
            message: "Message too long (max 2000 chars)",
          });
          return;
        }

        try {
          // Fetch fresh user details from DB to ensure avatar/name updates are instant
          const userRes = await pool.query(
            "SELECT name, university, avatar_url FROM users WHERE id = $1",
            [user.id]
          );
          const freshUser = userRes.rows[0] || user;

          const saved = await saveGeneralMessage(user.id, trimmed);

          const outgoing = {
            ...saved,
            sender_name: freshUser.name,
            sender_university: freshUser.university ?? "",
            sender_avatar_url: freshUser.avatar_url ?? null,
          };

          // Broadcast to ALL connected sockets (the entire platform)
          io.emit("receive_general_message", outgoing);
        } catch (err) {
          console.error("[chat] failed to save general message", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    // ── disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[chat] disconnected: ${user.name} — ${reason}`);
    });
  });

  return io;
}
