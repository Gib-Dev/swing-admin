import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, type MockDb } from "@/test/mocks/db";
import { mockAuthSuccess, mockAuthUnauthorized } from "@/test/mocks/auth";

// Mock modules
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let mockDb: MockDb;
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

// Import after mocks
import {
  createTournament,
  updateTournament,
  deleteTournament,
  toggleRegistration,
} from "./tournament";
import { revalidatePath } from "next/cache";

const validTournament = {
  name: "Summer Classic 2026",
  location: "Montreal Golf Club",
  startDate: new Date("2026-08-01"),
  endDate: new Date("2026-08-03"),
  maxTeams: 32,
  employeeRegistrationPrice: "150.00",
  currency: "CAD" as const,
};

beforeEach(() => {
  mockDb = createMockDb();
});

describe("createTournament", () => {
  it("creates a tournament when authenticated with valid data", async () => {
    mockAuthSuccess();

    const result = await createTournament(validTournament);

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await createTournament(validTournament);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns error for invalid data", async () => {
    mockAuthSuccess();

    const result = await createTournament({
      ...validTournament,
      name: "",
    });

    expect(result).toEqual({ success: false, error: "Invalid data" });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns error for end date before start date", async () => {
    mockAuthSuccess();

    const result = await createTournament({
      ...validTournament,
      startDate: new Date("2026-08-05"),
      endDate: new Date("2026-08-01"),
    });

    expect(result).toEqual({ success: false, error: "Invalid data" });
  });

  it("handles database errors gracefully", async () => {
    mockAuthSuccess();
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await createTournament(validTournament);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create tournament");
  });
});

describe("updateTournament", () => {
  it("updates tournament when found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      name: "Old Name",
    });

    const result = await updateTournament("t-1", { name: "New Name" });

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments");
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments/t-1");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await updateTournament("t-1", { name: "New Name" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tournament not found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await updateTournament("t-1", { name: "New Name" });

    expect(result).toEqual({ success: false, error: "Tournament not found" });
  });

  it("returns error for invalid data", async () => {
    mockAuthSuccess();

    const result = await updateTournament("t-1", { maxTeams: 0 });

    expect(result).toEqual({ success: false, error: "Invalid data" });
  });
});

describe("deleteTournament", () => {
  it("deletes tournament when found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({ id: "t-1" });

    const result = await deleteTournament("t-1");

    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await deleteTournament("t-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tournament not found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await deleteTournament("t-1");

    expect(result).toEqual({ success: false, error: "Tournament not found" });
  });
});

describe("toggleRegistration", () => {
  it("toggles registration open to closed", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      registrationOpen: true,
    });

    const result = await toggleRegistration("t-1");

    expect(result.success).toBe(true);
    expect(result.isOpen).toBe(false);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("toggles registration closed to open", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      registrationOpen: false,
    });

    const result = await toggleRegistration("t-1");

    expect(result.success).toBe(true);
    expect(result.isOpen).toBe(true);
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await toggleRegistration("t-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tournament not found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await toggleRegistration("t-1");

    expect(result).toEqual({ success: false, error: "Tournament not found" });
  });
});
