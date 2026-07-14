import {
  API_URL,
  createTestStudent,
  createTestInstructor,
  authHeader,
} from "../helpers/test-utils";

describe("Auth Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new student", async () => {
      const user = await createTestStudent({
        email: `student_${Date.now()}@test.edu`,
      });
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.token).toBeDefined();
    });

    it("should register a new instructor", async () => {
      const user = await createTestInstructor({
        email: `instructor_${Date.now()}@test.edu`,
      });
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.role).toBe("instructor");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 409 for duplicate email", async () => {
      const email = `duplicate_${Date.now()}@test.edu`;
      await createTestStudent({ email });
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email,
          password: "password123",
          university: "University of Lagos",
          course: "Computer Science",
          year_of_study: 3,
          role: "student",
        }),
      });
      expect(res.status).toBe(409);
    });

    it("should return 400 for short password", async () => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: `short_${Date.now()}@test.edu`,
          password: "12345",
          university: "University of Lagos",
          course: "Computer Science",
          year_of_study: 3,
          role: "student",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid role", async () => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: `invalid_${Date.now()}@test.edu`,
          password: "password123",
          university: "University of Lagos",
          role: "invalid",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const email = `login_${Date.now()}@test.edu`;
      const password = "testpass123";
      await createTestStudent({ email, password });

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(email);
    });

    it("should return 401 for invalid credentials", async () => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@test.edu",
          password: "wrongpass",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("should return 400 for missing fields", async () => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const user = await createTestStudent({
        email: `me_${Date.now()}@test.edu`,
      });
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: authHeader(user.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.email).toBe(user.email);
    });

    it("should return 401 without token", async () => {
      const res = await fetch(`${API_URL}/api/auth/me`);
      expect(res.status).toBe(401);
    });

    it("should return 403 with invalid token", async () => {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: authHeader("invalid-token"),
      });
      expect(res.status).toBe(403);
    });
  });
});
