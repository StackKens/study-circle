import jwt from "jsonwebtoken";
import { authenticateToken } from "../../src/middleware/auth.middleware";

const TEST_SECRET = "test-secret-key-for-jest";

describe("Auth Middleware", () => {
  const mockReq: any = {};
  const mockRes: any = {};
  const mockNext: any = jest.fn();

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    mockReq.headers = {};
    mockRes.status = jest.fn().mockReturnThis();
    mockRes.json = jest.fn().mockReturnThis();
    mockNext.mockClear();
  });

  describe("authenticateToken", () => {
    it("should return 401 if no token provided", () => {
      authenticateToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
    });

    it("should return 403 for invalid token", () => {
      mockReq.headers.authorization = "Bearer invalid-token";
      authenticateToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
    });

    it("should call next() and attach user for valid token", () => {
      const payload = { id: "user-123", email: "test@test.com" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

      mockReq.headers.authorization = `Bearer ${token}`;
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(payload.id);
      expect(mockReq.user.email).toBe(payload.email);
    });

    it("should return 403 for expired token", () => {
      const payload = { id: "user-123", email: "test@test.com" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "0s" });

      mockReq.headers.authorization = `Bearer ${token}`;
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
