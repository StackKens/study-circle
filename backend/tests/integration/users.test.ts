import {
  API_URL,
  createTestStudent,
  authHeader,
} from "../helpers/test-utils";

describe("Users Endpoints", () => {
  let student: any;

  beforeAll(async () => {
    student = await createTestStudent({
      email: `userstudent_${Date.now()}@test.edu`,
    });
  });

  describe("GET /api/users/home-stats", () => {
    it("should return homepage statistics", async () => {
      const res = await fetch(`${API_URL}/api/users/home-stats`);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.student_count).toBeDefined();
      expect(data.group_count).toBeDefined();
      expect(data.session_count).toBeDefined();
      expect(data.resource_count).toBeDefined();
    });
  });

  describe("GET /api/users/me/stats", () => {
    it("should return user statistics", async () => {
      const res = await fetch(`${API_URL}/api/users/me/stats`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(typeof data.groups).toBe("number");
      expect(typeof data.sessions).toBe("number");
      expect(typeof data.resources).toBe("number");
      expect(typeof data.studyHours).toBe("number");
    });
  });

  describe("GET /api/users/me/groups", () => {
    it("should return user's groups", async () => {
      const res = await fetch(`${API_URL}/api/users/me/groups`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/users/me/progress", () => {
    it("should return user progress", async () => {
      const res = await fetch(`${API_URL}/api/users/me/progress`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("PATCH /api/users/:id/bio", () => {
    it("should update user bio", async () => {
      const res = await fetch(`${API_URL}/api/users/${student.id}/bio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({ bio: "Updated bio for testing" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.bio).toBe("Updated bio for testing");
    });

    it("should return 403 when updating another user's bio", async () => {
      const otherStudent = await createTestStudent({
        email: `otheruser_${Date.now()}@test.edu`,
      });

      const res = await fetch(
        `${API_URL}/api/users/${otherStudent.id}/bio`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(student.token),
          },
          body: JSON.stringify({ bio: "Unauthorized update" }),
        },
      );

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/users/:id/avatar", () => {
    it("should update user avatar with valid Cloudinary URL", async () => {
      const res = await fetch(`${API_URL}/api/users/${student.id}/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          avatar_url:
            "https://res.cloudinary.com/test/image/upload/v123/avatar.jpg",
        }),
      });

      expect(res.status).toBe(200);
    });

    it("should return 400 for non-Cloudinary URL", async () => {
      const res = await fetch(`${API_URL}/api/users/${student.id}/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          avatar_url: "https://example.com/avatar.jpg",
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});
