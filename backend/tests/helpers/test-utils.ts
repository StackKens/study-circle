import jwt from "jsonwebtoken";

const API_URL = process.env.TEST_API_URL || "http://localhost:8080";

export { API_URL };

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function createTestToken(payload: {
  id: string;
  email: string;
  name?: string;
  university?: string;
  role?: string;
}): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name || "Test User",
      university: payload.university || "Test University",
      avatar_url: null,
      role: payload.role || "student",
    },
    process.env.JWT_SECRET || "test-secret-key-for-testing",
    { expiresIn: "1h" },
  );
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
  university: string;
  course: string;
  year_of_study: number;
  role: string;
}

let testUserCounter = 0;

export function generateUniqueEmail(): string {
  testUserCounter++;
  return `testuser${testUserCounter}_${Date.now()}@test.edu`;
}

export async function createTestStudent(
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    university: string;
    course: string;
    year_of_study: number;
  }> = {},
): Promise<TestUser> {
  const data = {
    name: overrides.name || `Test Student ${Date.now()}`,
    email: overrides.email || generateUniqueEmail(),
    password: overrides.password || "testpass123",
    university: overrides.university || "University of Lagos",
    course: overrides.course || "Computer Science",
    year_of_study: overrides.year_of_study || 3,
    role: "student",
  };

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json() as any;
  return { ...result.user, token: result.token, password: data.password };
}

export async function createTestInstructor(
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    university: string;
    bio: string;
    department: string;
  }> = {},
): Promise<TestUser> {
  const data = {
    name: overrides.name || `Test Instructor ${Date.now()}`,
    email: overrides.email || generateUniqueEmail(),
    password: overrides.password || "testpass123",
    university: overrides.university || "University of Lagos",
    bio: overrides.bio || "Experienced lecturer",
    department: overrides.department || "Computer Science",
    role: "instructor",
  };

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json() as any;
  return { ...result.user, token: result.token, password: data.password };
}

export async function loginTestUser(
  email: string,
  password: string,
): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return res.json() as Promise<{ token: string; user: any }>;
}

export async function createTestGroup(
  token: string,
  overrides: Partial<{
    name: string;
    subject: string;
    university: string;
    description: string;
    is_private: boolean;
  }> = {},
): Promise<any> {
  const data = {
    name: overrides.name || `Test Group ${Date.now()}`,
    subject: overrides.subject || "Computer Science",
    university: overrides.university || "University of Lagos",
    description: overrides.description || "A test study group",
    is_private: overrides.is_private || false,
  };

  const res = await fetch(`${API_URL}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function joinTestGroup(
  token: string,
  groupId: string,
): Promise<any> {
  const res = await fetch(`${API_URL}/api/groups/${groupId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });

  return res.json();
}

export async function createTestSession(
  token: string,
  groupId: string,
  overrides: Partial<{
    title: string;
    start_time: string;
    end_time: string;
    meet_link: string;
  }> = {},
): Promise<any> {
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const data = {
    group_id: groupId,
    title: overrides.title || `Test Session ${Date.now()}`,
    start_time: overrides.start_time || startTime.toISOString(),
    end_time: overrides.end_time || endTime.toISOString(),
    meet_link:
      overrides.meet_link || "https://meet.google.com/abc-defg-hij",
  };

  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function cleanupTestData(): Promise<void> {
  const pool = require("../src/db/index").default;
  try {
    await pool.query(
      `DELETE FROM users WHERE email LIKE '%@test.edu' AND email NOT LIKE '%admin%'`,
    );
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}
