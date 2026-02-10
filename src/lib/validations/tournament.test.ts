import { describe, it, expect } from "vitest";
import { createTournamentSchema, updateTournamentSchema } from "./tournament";

const validTournament = {
  name: "Summer Classic 2026",
  location: "Montreal Golf Club",
  startDate: new Date("2026-08-01"),
  endDate: new Date("2026-08-03"),
  maxTeams: 32,
  employeeRegistrationPrice: "150.00",
  currency: "CAD" as const,
};

describe("createTournamentSchema", () => {
  it("accepts valid tournament data", () => {
    const result = createTournamentSchema.safeParse(validTournament);
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("requires location", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      location: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects end date before start date", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      startDate: new Date("2026-08-03"),
      endDate: new Date("2026-08-01"),
    });
    expect(result.success).toBe(false);
  });

  it("accepts same start and end date", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-01"),
    });
    expect(result.success).toBe(true);
  });

  it("requires maxTeams to be at least 1", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      maxTeams: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxTeams over 500", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      maxTeams: 501,
    });
    expect(result.success).toBe(false);
  });

  it("validates price format — valid", () => {
    for (const price of ["100", "100.00", "0.50", "9999.99"]) {
      const result = createTournamentSchema.safeParse({
        ...validTournament,
        employeeRegistrationPrice: price,
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates price format — invalid", () => {
    for (const price of ["abc", "100.999", "-10", ""]) {
      const result = createTournamentSchema.safeParse({
        ...validTournament,
        employeeRegistrationPrice: price,
      });
      expect(result.success).toBe(false);
    }
  });

  it("accepts CAD and USD currency", () => {
    for (const currency of ["CAD", "USD"] as const) {
      const result = createTournamentSchema.safeParse({
        ...validTournament,
        currency,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid currency", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      currency: "EUR",
    });
    expect(result.success).toBe(false);
  });

  it("defaults currency to CAD when omitted", () => {
    const { currency, ...rest } = validTournament;
    const result = createTournamentSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("CAD");
    }
  });

  it("description is optional", () => {
    const result = createTournamentSchema.safeParse(validTournament);
    expect(result.success).toBe(true);

    const withDesc = createTournamentSchema.safeParse({
      ...validTournament,
      description: "A great tournament",
    });
    expect(withDesc.success).toBe(true);
  });

  it("rejects description over 2000 characters", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("coerces string dates", () => {
    const result = createTournamentSchema.safeParse({
      ...validTournament,
      startDate: "2026-08-01",
      endDate: "2026-08-03",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTournamentSchema", () => {
  it("accepts partial data", () => {
    const result = updateTournamentSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTournamentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts registrationOpen boolean", () => {
    const result = updateTournamentSchema.safeParse({
      registrationOpen: true,
    });
    expect(result.success).toBe(true);
  });

  it("validates fields when provided", () => {
    const result = updateTournamentSchema.safeParse({ maxTeams: 0 });
    expect(result.success).toBe(false);
  });
});
