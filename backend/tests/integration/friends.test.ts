import {
  API_URL,
  createTestStudent,
  authHeader,
} from "../helpers/test-utils";

describe("Friends Endpoints", () => {
  let student1: any;
  let student2: any;
  let student3: any;

  beforeAll(async () => {
    student1 = await createTestStudent({
      email: `friend1_${Date.now()}@test.edu`,
    });
    student2 = await createTestStudent({
      email: `friend2_${Date.now()}@test.edu`,
    });
    student3 = await createTestStudent({
      email: `friend3_${Date.now()}@test.edu`,
    });
  });

  describe("POST /api/friends/request/:id", () => {
    it("should send friend request", async () => {
      const res = await fetch(`${API_URL}/api/friends/request/${student2.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student1.token),
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it("should return 400 for self-request", async () => {
      const res = await fetch(`${API_URL}/api/friends/request/${student1.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student1.token),
        },
      });

      expect(res.status).toBe(400);
    });

    it("should return 409 for duplicate request", async () => {
      const res = await fetch(`${API_URL}/api/friends/request/${student2.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student1.token),
        },
      });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/friends/requests", () => {
    it("should return pending friend requests", async () => {
      const res = await fetch(`${API_URL}/api/friends/requests`, {
        headers: authHeader(student2.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/friends/request/:id/accept", () => {
    it("should accept friend request", async () => {
      const res = await fetch(
        `${API_URL}/api/friends/request/${student1.id}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(student2.token),
          },
        },
      );

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/friends", () => {
    it("should return list of friends", async () => {
      const res = await fetch(`${API_URL}/api/friends`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/friends/search", () => {
    it("should search users", async () => {
      const res = await fetch(
        `${API_URL}/api/friends/search?q=${student3.name.substring(0, 3)}`,
        {
          headers: authHeader(student1.token),
        },
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return empty for short query", async () => {
      const res = await fetch(`${API_URL}/api/friends/search?q=a`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([]);
    });
  });

  describe("DELETE /api/friends/:id", () => {
    it("should remove friend", async () => {
      const res = await fetch(`${API_URL}/api/friends/${student2.id}`, {
        method: "DELETE",
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });
});
