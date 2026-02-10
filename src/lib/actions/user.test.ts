import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, type MockDb } from "@/test/mocks/db";
import { mockAuthSuperAdmin, mockAuthSuccess, mockAuthUnauthorized } from "@/test/mocks/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

let mockDb: MockDb;
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

import { createUser, updateUser, deleteUser } from "./user";
import { revalidatePath } from "next/cache";

const validUser = {
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword",
  role: "admin" as const,
};

beforeEach(() => {
  mockDb = createMockDb();
});

describe("createUser", () => {
  it("creates user when super_admin", async () => {
    mockAuthSuperAdmin();
    mockDb.query.users.findFirst.mockResolvedValue(null); // no existing user

    const result = await createUser(validUser);

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/users");
  });

  it("rejects non-super_admin", async () => {
    mockAuthSuccess({ role: "admin" });

    const result = await createUser(validUser);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated", async () => {
    mockAuthUnauthorized();

    const result = await createUser(validUser);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("rejects invalid data", async () => {
    mockAuthSuperAdmin();

    const result = await createUser({ ...validUser, email: "not-email" });

    expect(result).toEqual({ success: false, error: "Invalid data" });
  });

  it("rejects duplicate email", async () => {
    mockAuthSuperAdmin();
    mockDb.query.users.findFirst.mockResolvedValue({ id: "existing" });

    const result = await createUser(validUser);

    expect(result).toEqual({
      success: false,
      error: "A user with this email already exists",
    });
  });
});

describe("updateUser", () => {
  const validUpdate = {
    name: "John Updated",
    email: "john@example.com",
    role: "admin" as const,
  };

  it("updates user when super_admin", async () => {
    mockAuthSuperAdmin();
    mockDb.query.users.findFirst.mockResolvedValue({
      id: "u-1",
      email: "john@example.com",
    });

    const result = await updateUser("u-1", validUpdate);

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/users");
  });

  it("rejects non-super_admin", async () => {
    mockAuthSuccess({ role: "admin" });

    const result = await updateUser("u-1", validUpdate);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when user not found", async () => {
    mockAuthSuperAdmin();
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const result = await updateUser("u-1", validUpdate);

    expect(result).toEqual({ success: false, error: "User not found" });
  });

  it("checks email uniqueness on change", async () => {
    mockAuthSuperAdmin();
    // First call: find existing user
    mockDb.query.users.findFirst
      .mockResolvedValueOnce({ id: "u-1", email: "old@example.com" })
      // Second call: email already taken
      .mockResolvedValueOnce({ id: "u-2", email: "john@example.com" });

    const result = await updateUser("u-1", validUpdate);

    expect(result).toEqual({
      success: false,
      error: "A user with this email already exists",
    });
  });
});

describe("deleteUser", () => {
  it("deletes user when super_admin", async () => {
    mockAuthSuperAdmin({ id: "u-admin" });
    mockDb.query.users.findFirst.mockResolvedValue({ id: "u-1" });

    const result = await deleteUser("u-1");

    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/users");
  });

  it("rejects non-super_admin", async () => {
    mockAuthSuccess({ role: "admin" });

    const result = await deleteUser("u-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("prevents self-deletion", async () => {
    mockAuthSuperAdmin({ id: "u-1" });

    const result = await deleteUser("u-1");

    expect(result).toEqual({
      success: false,
      error: "You cannot delete your own account",
    });
  });

  it("returns error when user not found", async () => {
    mockAuthSuperAdmin({ id: "u-admin" });
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const result = await deleteUser("u-1");

    expect(result).toEqual({ success: false, error: "User not found" });
  });
});
