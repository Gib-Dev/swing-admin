import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, type MockDb } from "@/test/mocks/db";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/stripe/checkout", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue(null),
}));

// Mock generateTeamCode separately since it's imported by the module under test
vi.mock("./team", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./team")>();
  return {
    ...actual,
    generateTeamCode: vi.fn().mockResolvedValue("ABC123"),
  };
});

let mockDb: MockDb;
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

import {
  createEmployeeRegistration,
  createSponsorRegistration,
} from "./registration";
import { createCheckoutSession } from "@/lib/stripe/checkout";

const validPlayer = {
  title: "mr" as const,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "514-555-1234",
  addressLine1: "123 Main St",
  city: "Montreal",
  province: "Quebec",
  postalCode: "H2X 1A1",
  country: "Canada",
};

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

const mockTournament = {
  id: validUuid,
  name: "Summer Classic",
  registrationOpen: true,
  employeeRegistrationPrice: "150.00",
  currency: "CAD",
};

beforeEach(() => {
  mockDb = createMockDb();
  vi.clearAllMocks();
});

describe("createEmployeeRegistration", () => {
  it("creates registration with create-team option", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(mockTournament);
    // Transaction runs the callback with mockDb
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "reg-1" }]),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      }),
    });

    const result = await createEmployeeRegistration({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create", teamName: "Team Alpha" },
      locale: "en",
    });

    expect(result.success).toBe(true);
    expect(result.registrationId).toBe("reg-1");
  });

  it("returns error for invalid data", async () => {
    const result = await createEmployeeRegistration({
      tournamentId: "not-uuid",
      player: validPlayer,
      teamOption: { type: "create" },
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid registration data",
    });
  });

  it("returns error when tournament not found or closed", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await createEmployeeRegistration({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create" },
    });

    expect(result).toEqual({
      success: false,
      error: "Tournament not found or registration closed",
    });
  });

  it("attempts Stripe checkout after registration", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(mockTournament);
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "reg-1" }]),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      }),
    });
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });

    const result = await createEmployeeRegistration({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create" },
      locale: "en",
    });

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/test");
    expect(createCheckoutSession).toHaveBeenCalled();
  });

  it("returns null checkout URL when Stripe not configured", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(mockTournament);
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "reg-1" }]),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      }),
    });
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await createEmployeeRegistration({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create" },
    });

    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBeNull();
  });
});

describe("createSponsorRegistration", () => {
  const validCompany = {
    companyName: "Acme Corp",
    contactName: "Jane Smith",
    contactEmail: "jane@acme.com",
    contactPhone: "514-555-9876",
    addressLine1: "456 Business Blvd",
    city: "Toronto",
    province: "Ontario",
    postalCode: "M5V 1A1",
    country: "Canada",
  };

  it("returns error for invalid data", async () => {
    const result = await createSponsorRegistration({
      tournamentId: "not-uuid",
      selectedTiers: [],
      company: validCompany,
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid registration data",
    });
  });

  it("returns error when tournament not found or closed", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(null);

    const result = await createSponsorRegistration({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
    });

    expect(result).toEqual({
      success: false,
      error: "Tournament not found or registration closed",
    });
  });

  it("returns error when selected tier not found", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(mockTournament);
    // Return empty — no tiers match
    mockDb.query.sponsorshipTiers.findMany.mockResolvedValue([]);

    const result = await createSponsorRegistration({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
    });

    expect(result).toEqual({
      success: false,
      error: "One or more selected tiers not found",
    });
  });

  it("creates sponsor registration with matching tiers", async () => {
    mockDb.query.tournaments.findFirst.mockResolvedValue(mockTournament);
    mockDb.query.sponsorshipTiers.findMany.mockResolvedValue([
      { id: validUuid, price: "5000.00", maxQuota: null, name: "Gold" },
    ]);
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "reg-1" }]),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      }),
    });
    // Mock select for quota check
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });

    const result = await createSponsorRegistration({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
      locale: "fr",
    });

    expect(result.success).toBe(true);
    expect(result.registrationId).toBe("reg-1");
  });
});
