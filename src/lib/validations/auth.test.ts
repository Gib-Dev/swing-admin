import { describe, it, expect } from "vitest";
import { loginSchema, createUserSchema, updateUserSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("requires email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("requires password", () => {
    const result = loginSchema.safeParse({
      email: "admin@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires password at least 8 characters", () => {
    const result = loginSchema.safeParse({
      email: "admin@test.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("createUserSchema", () => {
  const validUser = {
    name: "John Doe",
    email: "john@example.com",
    password: "securepassword",
    role: "admin" as const,
  };

  it("accepts valid user data", () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = createUserSchema.safeParse({ ...validUser, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  it("requires password at least 8 characters", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password over 100 characters", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts admin and super_admin roles", () => {
    for (const role of ["admin", "super_admin"] as const) {
      const result = createUserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: "viewer",
    });
    expect(result.success).toBe(false);
  });

  it("defaults role to admin", () => {
    const { role, ...rest } = validUser;
    const result = createUserSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("admin");
    }
  });
});

describe("updateUserSchema", () => {
  const validUpdate = {
    name: "John Doe",
    email: "john@example.com",
    role: "admin" as const,
  };

  it("accepts valid update data without password", () => {
    const result = updateUserSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("accepts empty string password (no change)", () => {
    const result = updateUserSchema.safeParse({
      ...validUpdate,
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid password update", () => {
    const result = updateUserSchema.safeParse({
      ...validUpdate,
      password: "newpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password when provided", () => {
    const result = updateUserSchema.safeParse({
      ...validUpdate,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("requires role (not optional)", () => {
    const { role, ...rest } = validUpdate;
    const result = updateUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
