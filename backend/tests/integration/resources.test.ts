import {
  API_URL,
  createTestStudent,
  createTestGroup,
  authHeader,
} from "../helpers/test-utils";

describe("Resources Endpoints", () => {
  let student: any;
  let group: any;

  beforeAll(async () => {
    student = await createTestStudent({
      email: `resourcestudent_${Date.now()}@test.edu`,
    });
    group = await createTestGroup(student.token);
  });

  describe("POST /api/resources", () => {
    it("should upload a resource", async () => {
      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Test Resource",
          type: "link",
          url: "https://example.com/resource",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.title).toBe("Test Resource");
      expect(data.type).toBe("link");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({ title: "Incomplete Resource" }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid resource type", async () => {
      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Invalid Type Resource",
          type: "invalid",
          url: "https://example.com/resource",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 403 for non-group member", async () => {
      const outsider = await createTestStudent({
        email: `resourceoutsider_${Date.now()}@test.edu`,
      });

      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(outsider.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Unauthorized Resource",
          type: "link",
          url: "https://example.com/resource",
        }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/resources", () => {
    it("should return user's resources", async () => {
      const res = await fetch(`${API_URL}/api/resources`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("GET /api/resources/all", () => {
    it("should return all resources user has access to", async () => {
      const res = await fetch(`${API_URL}/api/resources/all`, {
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("PATCH /api/resources/:id/download", () => {
    it("should increment download count", async () => {
      const uploadRes = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(student.token),
        },
        body: JSON.stringify({
          group_id: group.id,
          title: "Download Test Resource",
          type: "pdf",
          url: "https://example.com/test.pdf",
        }),
      });
      const resource = await uploadRes.json() as any;

      const res = await fetch(`${API_URL}/api/resources/${resource.id}/download`, {
        method: "PATCH",
        headers: authHeader(student.token),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.downloads).toBeGreaterThanOrEqual(1);
    });
  });
});
