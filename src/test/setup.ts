import { afterEach, vi } from "vitest";

// Mock environment variables
process.env["DATABASE_URL"] = "postgres://test:test@localhost:5432/test";
process.env["NEXTAUTH_SECRET"] = "test-secret";

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
