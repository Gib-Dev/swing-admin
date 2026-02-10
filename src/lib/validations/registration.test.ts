import { describe, it, expect } from "vitest";
import {
  employeeRegistrationSchema,
  sponsorRegistrationSchema,
  teamCodeSchema,
} from "./registration";

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

describe("employeeRegistrationSchema", () => {
  it("accepts valid create-team registration", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create", teamName: "Team Alpha" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts create-team without name", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid join-team registration", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "join", teamCode: "ABC123" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tournament ID", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: "not-a-uuid",
      player: validPlayer,
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects team code with wrong length", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "join", teamCode: "ABC" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase team code", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: validPlayer,
      teamOption: { type: "join", teamCode: "abc123" },
    });
    expect(result.success).toBe(false);
  });

  it("validates player title enum", () => {
    for (const title of ["mr", "mrs", "ms", "dr"] as const) {
      const result = employeeRegistrationSchema.safeParse({
        tournamentId: validUuid,
        player: { ...validPlayer, title },
        teamOption: { type: "create" },
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid player title", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: { ...validPlayer, title: "prof" },
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(false);
  });

  it("requires player email", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: { ...validPlayer, email: "" },
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(false);
  });

  it("validates phone format", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: { ...validPlayer, phone: "abc-invalid" },
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts various phone formats", () => {
    for (const phone of ["5145551234", "514-555-1234", "+1 (514) 555-1234"]) {
      const result = employeeRegistrationSchema.safeParse({
        tournamentId: validUuid,
        player: { ...validPlayer, phone },
        teamOption: { type: "create" },
      });
      expect(result.success).toBe(true);
    }
  });

  it("birthDate is optional", () => {
    const result = employeeRegistrationSchema.safeParse({
      tournamentId: validUuid,
      player: { ...validPlayer },
      teamOption: { type: "create" },
    });
    expect(result.success).toBe(true);
  });
});

describe("sponsorRegistrationSchema", () => {
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

  it("accepts valid sponsor registration", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one tier", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: [],
      company: validCompany,
    });
    expect(result.success).toBe(false);
  });

  it("validates tier IDs as UUIDs", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: ["not-a-uuid"],
      company: validCompany,
    });
    expect(result.success).toBe(false);
  });

  it("players are optional", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
    });
    expect(result.success).toBe(true);
  });

  it("accepts players when provided", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: validCompany,
      players: [validPlayer],
    });
    expect(result.success).toBe(true);
  });

  it("validates company required fields", () => {
    const result = sponsorRegistrationSchema.safeParse({
      tournamentId: validUuid,
      selectedTiers: [validUuid],
      company: { ...validCompany, companyName: "" },
    });
    expect(result.success).toBe(false);
  });
});

describe("teamCodeSchema", () => {
  it("accepts valid 6-char uppercase alphanumeric code", () => {
    const result = teamCodeSchema.safeParse({ code: "ABC123" });
    expect(result.success).toBe(true);
  });

  it("rejects code with wrong length", () => {
    const result = teamCodeSchema.safeParse({ code: "ABC" });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase code", () => {
    const result = teamCodeSchema.safeParse({ code: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects code with special characters", () => {
    const result = teamCodeSchema.safeParse({ code: "ABC-12" });
    expect(result.success).toBe(false);
  });
});
