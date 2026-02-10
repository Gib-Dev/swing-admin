import { vi } from "vitest";
import { auth } from "@/lib/auth";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
}

const defaultUser: MockUser = {
  id: "user-1",
  name: "Test Admin",
  email: "admin@test.com",
  role: "admin",
};

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;

export function mockAuthSuccess(user?: Partial<MockUser>) {
  mockedAuth.mockResolvedValue({
    user: { ...defaultUser, ...user },
  });
}

export function mockAuthSuperAdmin(user?: Partial<MockUser>) {
  mockAuthSuccess({ role: "super_admin", ...user });
}

export function mockAuthUnauthorized() {
  mockedAuth.mockResolvedValue(null);
}
