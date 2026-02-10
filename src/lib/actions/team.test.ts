import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, type MockDb } from "@/test/mocks/db";
import { mockAuthSuccess, mockAuthUnauthorized } from "@/test/mocks/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let mockDb: MockDb;
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

import {
  generateTeamCode,
  validateTeamCode,
  createTeamForTournament,
  updateTeamName,
  deleteTeam,
  movePlayerToTeam,
} from "./team";
import { revalidatePath } from "next/cache";

beforeEach(() => {
  mockDb = createMockDb();
});

describe("generateTeamCode", () => {
  it("generates a 6-character code", async () => {
    // First call: not found (unique), so it returns
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    const code = await generateTeamCode();

    expect(code).toHaveLength(6);
  });

  it("generates uppercase alphanumeric codes excluding ambiguous chars", () => {
    const safeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    // Mock to return null immediately (unique on first try)
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    // Run multiple times to check character set
    return Promise.all(
      Array.from({ length: 20 }, async () => {
        const code = await generateTeamCode();
        for (const char of code) {
          expect(safeChars).toContain(char);
        }
      })
    );
  });

  it("retries if code already exists", async () => {
    // First check: exists, second check: unique
    mockDb.query.teams.findFirst
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(null);

    const code = await generateTeamCode();

    expect(code).toHaveLength(6);
    expect(mockDb.query.teams.findFirst).toHaveBeenCalledTimes(2);
  });
});

describe("validateTeamCode", () => {
  it("returns valid with teamId when team exists with space", async () => {
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-1",
      code: "ABC123",
      tournamentId: "t-1",
    });
    // Player count: 2 (not full)
    const selectFromWhere = vi.fn().mockResolvedValue([{ count: 2 }]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: selectFromWhere,
      }),
    });

    const result = await validateTeamCode("t-1", "ABC123");

    expect(result).toEqual({ valid: true, teamId: "team-1" });
  });

  it("returns error when team not found", async () => {
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    const result = await validateTeamCode("t-1", "XXXXXX");

    expect(result).toEqual({ valid: false, error: "Team not found" });
  });

  it("returns error when team is full", async () => {
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-1",
      code: "ABC123",
    });
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 4 }]),
      }),
    });

    const result = await validateTeamCode("t-1", "ABC123");

    expect(result).toEqual({
      valid: false,
      error: "Team is full (4/4 players)",
    });
  });
});

describe("createTeamForTournament", () => {
  it("creates team when authenticated", async () => {
    mockAuthSuccess();
    mockDb.query.teams.findFirst.mockResolvedValue(null); // for generateTeamCode

    const result = await createTeamForTournament("t-1", "Team Alpha");

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments/t-1");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await createTeamForTournament("t-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });
});

describe("updateTeamName", () => {
  it("updates team name when found", async () => {
    mockAuthSuccess();
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-1",
      tournamentId: "t-1",
    });

    const result = await updateTeamName("team-1", "New Name");

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments/t-1");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await updateTeamName("team-1", "New Name");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when team not found", async () => {
    mockAuthSuccess();
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    const result = await updateTeamName("team-1", "New Name");

    expect(result).toEqual({ success: false, error: "Team not found" });
  });
});

describe("deleteTeam", () => {
  it("deletes team when found", async () => {
    mockAuthSuccess();
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-1",
      tournamentId: "t-1",
    });

    const result = await deleteTeam("team-1");

    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments/t-1");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await deleteTeam("team-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when team not found", async () => {
    mockAuthSuccess();
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    const result = await deleteTeam("team-1");

    expect(result).toEqual({ success: false, error: "Team not found" });
  });
});

describe("movePlayerToTeam", () => {
  it("moves player to a team with space", async () => {
    mockAuthSuccess();
    mockDb.query.players.findFirst.mockResolvedValue({ id: "p-1" });
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-2",
      tournamentId: "t-1",
    });
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
    });

    const result = await movePlayerToTeam("p-1", "team-2", "t-1");

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/tournaments/t-1");
  });

  it("unassigns player when targetTeamId is null", async () => {
    mockAuthSuccess();
    mockDb.query.players.findFirst.mockResolvedValue({ id: "p-1" });

    const result = await movePlayerToTeam("p-1", null, "t-1");

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await movePlayerToTeam("p-1", "team-2", "t-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when player not found", async () => {
    mockAuthSuccess();
    mockDb.query.players.findFirst.mockResolvedValue(null);

    const result = await movePlayerToTeam("p-1", "team-2", "t-1");

    expect(result).toEqual({ success: false, error: "Player not found" });
  });

  it("returns error when target team not found", async () => {
    mockAuthSuccess();
    mockDb.query.players.findFirst.mockResolvedValue({ id: "p-1" });
    mockDb.query.teams.findFirst.mockResolvedValue(null);

    const result = await movePlayerToTeam("p-1", "team-2", "t-1");

    expect(result).toEqual({ success: false, error: "Team not found" });
  });

  it("returns error when target team is full", async () => {
    mockAuthSuccess();
    mockDb.query.players.findFirst.mockResolvedValue({ id: "p-1" });
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-2",
      tournamentId: "t-1",
    });
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 4 }]),
      }),
    });

    const result = await movePlayerToTeam("p-1", "team-2", "t-1");

    expect(result).toEqual({
      success: false,
      error: "Team is full (4/4 players)",
    });
  });
});
