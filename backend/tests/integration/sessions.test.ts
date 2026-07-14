import {
  API_URL,
  createTestStudent,
  createTestGroup,
  createTestSession,
  authHeader,
} from "../helpers/test-utils";

describe("Sessions Endpoints", () => {
  let student: any;
  let group: any;

  beforeAll(async () => {
    student = await createTestStudent({
      email: `sessionstudent_${Date.now()}@test.edu`,
    });
    group = await createTestGroup(student.token);
  });

  describe("POST /api/sessions", () => {
    it("should create a new session", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Test Session",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          meet_link: "https://meet.google.com/abc-defg-hij",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.title).toBe("Test Session");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({ title: "Incomplete Session" }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid Google Meet link", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Test Session",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          meet_link: "https://zoom.us/j/123456789",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 403 for non-admin member", async () => {
      const creator = await createTestStudent({
        email: `sessioncreator_${Date.now()}@test.edu`,
      });
      const testGroup = await createTestGroup(creator.token);

      const member = await createTestStudent({
        email: `sessionmember_${Date.now()}@test.edu`,
      });

      const joinRes = await fetch(
        `${API_URL}/api/groups/${testGroup.id}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(member.token),
          },
        },
      );

      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(member.token),
        },
        body: JSON.stringify({
          group_id: testGroup.id,
          title: "Unauthorized Session",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          meet_link: "https://meet.google.com/abc-defg-hij",
        }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/sessions", () => {
    it("should return user's sessions", async () => {
      const res = await fetch(`${API_URL}/api/sessions`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("POST /api/sessions/:id/join", () => {
    it("should join an upcoming session", async () => {
      const session = await createTestSession(student.token, group.id);

      const member = await createTestStudent({
        email: `joinmember_${Date.now()}@test.edu`,
      });

      const joinRes = await fetch(
        `${API_URL}/api/groups/${group.id}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(member.token),
          },
        },
      );

      const res = await fetch(`${API_URL}/api/sessions/${session.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(member.token),
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.joined).toBe(true);
    });

    it("should return 403 for non-group member", async () => {
      const session = await createTestSession(student.token, group.id);

      const outsider = await createTestStudent({
        email: `outsider_${Date.now()}@test.edu`,
      });

      const res = await fetch(`${API_URL}/api/sessions/${session.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(outsider.token),
        },
      });

      expect(res.status).toBe(403);
    });
  });
});
