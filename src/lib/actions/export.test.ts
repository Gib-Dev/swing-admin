import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, type MockDb } from "@/test/mocks/db";
import { mockAuthSuccess, mockAuthUnauthorized } from "@/test/mocks/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let mockDb: MockDb;
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

import { exportTournamentsCsv, exportTournamentDetailCsv } from "./export";

beforeEach(() => {
  mockDb = createMockDb();
});

describe("exportTournamentsCsv", () => {
  it("returns CSV with headers when authenticated", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findMany.mockResolvedValue([
      {
        name: "Summer Classic",
        location: "Montreal",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-03"),
        maxTeams: 32,
        teams: [{ id: "t1" }, { id: "t2" }],
        registrations: [{ id: "r1" }],
        sponsorshipTiers: [{ id: "s1" }],
        employeeRegistrationPrice: "150.00",
        currency: "CAD",
        registrationOpen: true,
        createdAt: new Date("2026-01-15"),
      },
    ]);

    const result = await exportTournamentsCsv();

    expect(result.success).toBe(true);
    expect(result.data).toContain("Name,Location,Start Date");
    expect(result.data).toContain("Summer Classic");
    expect(result.data).toContain("2026-08-01");
    expect(result.data).toContain("Yes"); // registrationOpen
    expect(result.data).toContain("2"); // team count
    expect(result.data).toContain("1"); // registration count
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await exportTournamentsCsv();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("handles empty tournament list", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findMany.mockResolvedValue([]);

    const result = await exportTournamentsCsv();

    expect(result.success).toBe(true);
    // Only headers
    expect(result.data!.split("\n")).toHaveLength(1);
  });

  it("escapes CSV values with commas", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findMany.mockResolvedValue([
      {
        name: "Summer, Classic",
        location: "Montreal",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-03"),
        maxTeams: 32,
        teams: [],
        registrations: [],
        sponsorshipTiers: [],
        employeeRegistrationPrice: "150.00",
        currency: "CAD",
        registrationOpen: false,
        createdAt: new Date("2026-01-15"),
      },
    ]);

    const result = await exportTournamentsCsv();

    expect(result.success).toBe(true);
    expect(result.data).toContain('"Summer, Classic"');
  });
});

describe("exportTournamentDetailCsv", () => {
  it("returns CSV with team and player data", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      name: "Summer Classic",
      teams: [
        {
          name: "Team Alpha",
          code: "ABC123",
          players: [
            {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "514-555-1234",
              city: "Montreal",
              province: "Quebec",
            },
          ],
        },
      ],
      registrations: [],
      sponsorshipTiers: [],
    });

    const result = await exportTournamentDetailCsv("t-1");

    expect(result.success).toBe(true);
    expect(result.data).toContain("Type,Team Name,Team Code");
    expect(result.data).toContain("Player");
    expect(result.data).toContain("Team Alpha");
    expect(result.data).toContain("ABC123");
    expect(result.data).toContain("John Doe");
    expect(result.filename).toContain("Summer_Classic");
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await exportTournamentDetailCsv("t-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tournament not found", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await exportTournamentDetailCsv("t-1");

    expect(result).toEqual({ success: false, error: "Tournament not found" });
  });

  it("handles empty teams with no players", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      name: "Empty Tournament",
      teams: [
        {
          name: "Empty Team",
          code: "XYZ789",
          players: [],
        },
      ],
      registrations: [],
      sponsorshipTiers: [],
    });

    const result = await exportTournamentDetailCsv("t-1");

    expect(result.success).toBe(true);
    expect(result.data).toContain("Team");
    expect(result.data).toContain("Empty Team");
    expect(result.data).toContain("XYZ789");
  });

  it("escapes CSV values with quotes", async () => {
    mockAuthSuccess();
    mockDb.query.tournaments.findFirst.mockResolvedValue({
      id: "t-1",
      name: 'The "Big" Tournament',
      teams: [
        {
          name: 'Team "A"',
          code: "ABC123",
          players: [],
        },
      ],
      registrations: [],
      sponsorshipTiers: [],
    });

    const result = await exportTournamentDetailCsv("t-1");

    expect(result.success).toBe(true);
    expect(result.data).toContain('"Team ""A"""');
  });
});
