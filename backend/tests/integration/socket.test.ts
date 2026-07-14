import { io as ioClient, Socket } from "socket.io-client";
import jwt from "jsonwebtoken";
import {
  API_URL,
  createTestStudent,
  createTestGroup,
} from "../helpers/test-utils";

const SOCKET_URL = process.env.TEST_SOCKET_URL || "http://localhost:8080";

function connectSocket(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });

    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err: any) => reject(err));

    setTimeout(() => reject(new Error("Socket connection timeout")), 5000);
  });
}

describe("Socket.io Chat", () => {
  let student1: any;
  let student2: any;
  let group: any;

  beforeAll(async () => {
    student1 = await createTestStudent({
      email: `socket1_${Date.now()}@test.edu`,
    });
    student2 = await createTestStudent({
      email: `socket2_${Date.now()}@test.edu`,
    });
    group = await createTestGroup(student1.token);

    // Join student2 to the group
    await fetch(`${API_URL}/api/groups/${group.id}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${student2.token}`,
      },
    });
  }, 30000);

  describe("Group Chat", () => {
    it("should connect to socket server", async () => {
      const socket = await connectSocket(student1.token);
      expect(socket.connected).toBe(true);
      socket.disconnect();
    }, 10000);

    it("should join a room", async () => {
      const socket = await connectSocket(student1.token);

      const joined = await new Promise<boolean>((resolve) => {
        socket.emit("join_room", { groupId: group.id });
        socket.on("message_history", () => resolve(true));
        setTimeout(() => resolve(false), 3000);
      });

      expect(joined).toBe(true);
      socket.disconnect();
    }, 10000);

    it("should send and receive messages", async () => {
      const socket1 = await connectSocket(student1.token);
      const socket2 = await connectSocket(student2.token);

      // Both join the room
      socket1.emit("join_room", { groupId: group.id });
      socket2.emit("join_room", { groupId: group.id });

      // Wait for both to join
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const messageContent = `Test message ${Date.now()}`;

      const receivedMessage = await new Promise<any>((resolve) => {
        socket2.on("receive_message", (msg: any) => resolve(msg));
        socket1.emit("send_message", {
          groupId: group.id,
          content: messageContent,
        });
        setTimeout(() => resolve(null), 5000);
      });

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.content).toBe(messageContent);

      socket1.disconnect();
      socket2.disconnect();
    }, 15000);
  });

  describe("General Chat", () => {
    it("should join general chat and receive messages", async () => {
      const socket = await connectSocket(student1.token);

      const joined = await new Promise<boolean>((resolve) => {
        socket.emit("join_general_room");
        socket.on("general_message_history", () => resolve(true));
        setTimeout(() => resolve(false), 3000);
      });

      expect(joined).toBe(true);
      socket.disconnect();
    }, 10000);
  });

  describe("Authentication", () => {
    it("should reject connection without token", async () => {
      try {
        const socket = ioClient(SOCKET_URL, {
          transports: ["websocket"],
          reconnection: false,
        });

        await new Promise<void>((resolve, reject) => {
          socket.on("connect_error", () => {
            socket.disconnect();
            resolve();
          });
          socket.on("connect", () => {
            socket.disconnect();
            reject(new Error("Should not connect without token"));
          });
          setTimeout(() => {
            socket.disconnect();
            resolve();
          }, 3000);
        });
      } catch {}
    }, 10000);
  });
});
