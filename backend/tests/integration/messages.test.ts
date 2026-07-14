import {
  API_URL,
  createTestStudent,
  authHeader,
} from "../helpers/test-utils";

describe("Messages Endpoints", () => {
  let student1: any;
  let student2: any;

  beforeAll(async () => {
    student1 = await createTestStudent({
      email: `msgstudent1_${Date.now()}@test.edu`,
    });
    student2 = await createTestStudent({
      email: `msgstudent2_${Date.now()}@test.edu`,
    });
  });

  describe("GET /api/messages/conversations", () => {
    it("should return user's conversations", async () => {
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/messages/search", () => {
    it("should search users for messaging", async () => {
      const res = await fetch(
        `${API_URL}/api/messages/search?q=${student2.name.substring(0, 3)}`,
        {
          headers: authHeader(student1.token),
        },
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return empty for short query", async () => {
      const res = await fetch(`${API_URL}/api/messages/search?q=a`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([]);
    });
  });

  describe("GET /api/messages/:userId", () => {
    it("should return message history with user", async () => {
      const res = await fetch(`${API_URL}/api/messages/${student2.id}`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return 400 for self-conversation", async () => {
      const res = await fetch(`${API_URL}/api/messages/${student1.id}`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(400);
    });
  });
});
