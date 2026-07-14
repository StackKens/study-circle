import {
  API_URL,
  createTestStudent,
  authHeader,
} from "../helpers/test-utils";

describe("Notifications Endpoints", () => {
  let student: any;

  beforeAll(async () => {
    student = await createTestStudent({
      email: `notifstudent_${Date.now()}@test.edu`,
    });
  });

  describe("GET /api/notifications", () => {
    it("should return user's notifications", async () => {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return 401 without token", async () => {
      const res = await fetch(`${API_URL}/api/notifications`);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should return unread notification count", async () => {
      const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(typeof data.count).toBe("number");
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      const listRes = await fetch(`${API_URL}/api/notifications`, {
        headers: authHeader(student.token),
      });
      const notifications = await listRes.json() as any[];

      if (notifications.length > 0) {
        const notifId = notifications[0].id;
        const res = await fetch(
          `${API_URL}/api/notifications/${notifId}/read`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(student.token),
            },
          },
        );

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
      }
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });
});
