import { getCached, setCache } from "../../src/utils/cache";

describe("Cache Utility", () => {
  beforeEach(() => {
    // Clear all cache before each test
    const keys = (global as any).__cacheKeys || [];
    keys.forEach((key: string) => {
      try {
        // We can't directly access the Map, so we'll just wait for TTL
      } catch {}
    });
  });

  describe("getCached", () => {
    it("should return undefined for non-existent key", () => {
      const result = getCached("nonexistent-key");
      expect(result).toBeUndefined();
    });

    it("should return cached data for valid key", () => {
      const testData = { name: "test", value: 123 };
      setCache("test-key", testData);
      const result = getCached("test-key");
      expect(result).toEqual(testData);
    });

    it("should return undefined for expired cache", () => {
      const testData = { name: "expired" };
      setCache("expired-key", testData, -1); // Negative TTL = expired
      const result = getCached("expired-key");
      expect(result).toBeUndefined();
    });
  });

  describe("setCache", () => {
    it("should store data with default TTL", () => {
      const testData = { message: "hello" };
      setCache("default-ttl-key", testData);
      const result = getCached("default-ttl-key");
      expect(result).toEqual(testData);
    });

    it("should store data with custom TTL", () => {
      const testData = { message: "custom ttl" };
      setCache("custom-ttl-key", testData, 60000); // 1 minute
      const result = getCached("custom-ttl-key");
      expect(result).toEqual(testData);
    });

    it("should overwrite existing cache entry", () => {
      setCache("overwrite-key", { version: 1 });
      setCache("overwrite-key", { version: 2 });
      const result = getCached("overwrite-key");
      expect(result).toEqual({ version: 2 });
    });
  });
});
