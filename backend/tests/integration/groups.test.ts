import {
  API_URL,
  createTestStudent,
  createTestGroup,
  joinTestGroup,
  authHeader,
} from "../helpers/test-utils";

describe("Groups Endpoints", () => {
  let student1: any;
  let student2: any;

  beforeAll(async () => {
    student1 = await createTestStudent({
      email: `groupstudent1_${Date.now()}@test.edu`,
    });
    student2 = await createTestStudent({
      email: `groupstudent2_${Date.now()}@test.edu`,
    });
  });

  describe("POST /api/groups", () => {
    it("should create a new group", async () => {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student1.token),
        },
        body: JSON.stringify({
          name: "Test Study Group",
          subject: "Computer Science",
          university: "University of Lagos",
          description: "A group for testing",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.name).toBe("Test Study Group");
      expect(data.subject).toBe("Computer Science");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student1.token),
        },
        body: JSON.stringify({ name: "Incomplete Group" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/groups", () => {
    it("should return user's groups", async () => {
      const res = await fetch(`${API_URL}/api/groups`, {
        headers: authHeader(student1.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("POST /api/groups/:id/join", () => {
    it("should allow user to join a public group", async () => {
      const group = await createTestStudent({
        email: `joincreator_${Date.now()}@test.edu`,
      }).then((u) => createTestGroup(u.token));

      const res = await fetch(`${API_URL}/api/groups/${group.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student2.token),
        },
      });

      expect(res.status).toBe(201);
    });

    it("should prevent joining private groups without invite", async () => {
      const creator = await createTestStudent({
        email: `privatecreator_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token, {
        name: "Private Group",
        is_private: true,
      });

      const res = await fetch(`${API_URL}/api/groups/${group.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student2.token),
        },
      });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/groups/:id/leave", () => {
    it("should allow member to leave group", async () => {
      const creator = await createTestStudent({
        email: `leavecreator_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token);

      const member = await createTestStudent({
        email: `leavemember_${Date.now()}@test.edu`,
      });
      await joinTestGroup(member.token, group.id);

      const res = await fetch(`${API_URL}/api/groups/${group.id}/leave`, {
        method: "DELETE",
        headers: authHeader(member.token),
      });

      expect(res.status).toBe(200);
    });

    it("should prevent admin from leaving group", async () => {
      const creator = await createTestStudent({
        email: `adminleave_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token);

      const res = await fetch(`${API_URL}/api/groups/${group.id}/leave`, {
        method: "DELETE",
        headers: authHeader(creator.token),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/groups/:id/invite", () => {
    it("should generate invite link for admin", async () => {
      const creator = await createTestStudent({
        email: `invitecreator_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token);

      const res = await fetch(`${API_URL}/api/groups/${group.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(creator.token),
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.token).toBeDefined();
      expect(data.invite_url).toBeDefined();
    });

    it("should prevent non-admin from generating invite", async () => {
      const creator = await createTestStudent({
        email: `invitecreator2_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token);

      const member = await createTestStudent({
        email: `invitemember_${Date.now()}@test.edu`,
      });
      await joinTestGroup(member.token, group.id);

      const res = await fetch(`${API_URL}/api/groups/${group.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(member.token),
        },
      });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/groups/invite/:token/accept", () => {
    it("should accept invite and join group", async () => {
      const creator = await createTestStudent({
        email: `acceptcreator_${Date.now()}@test.edu`,
      });
      const group = await createTestGroup(creator.token);

      const inviteRes = await fetch(
        `${API_URL}/api/groups/${group.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(creator.token),
          },
        },
      );
      const inviteData = await inviteRes.json() as any;

      const newMember = await createTestStudent({
        email: `acceptmember_${Date.now()}@test.edu`,
      });
      const res = await fetch(
        `${API_URL}/api/groups/invite/${inviteData.token}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(newMember.token),
          },
        },
      );

      expect(res.status).toBe(201);
    });

    it("should return 404 for invalid invite token", async () => {
      const res = await fetch(
        `${API_URL}/api/groups/invite/invalid-token/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(student1.token),
          },
        },
      );

      expect(res.status).toBe(404);
    });
  });
});
