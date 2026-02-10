import { describe, it, expect } from "vitest";
import {
  createSponsorshipTierSchema,
  updateSponsorshipTierSchema,
} from "./sponsorship";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

const validTier = {
  tournamentId: validUuid,
  name: "Gold Sponsor",
  price: "5000.00",
  playerSpotsIncluded: 4,
  teamSpotsIncluded: 1,
  sortOrder: 0,
};

describe("createSponsorshipTierSchema", () => {
  it("accepts valid tier data", () => {
    const result = createSponsorshipTierSchema.safeParse(validTier);
    expect(result.success).toBe(true);
  });

  it("requires tournamentId as UUID", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      tournamentId: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("requires name", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("validates price format", () => {
    for (const price of ["100", "100.00", "0.50"]) {
      const result = createSponsorshipTierSchema.safeParse({
        ...validTier,
        price,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid price format", () => {
    for (const price of ["abc", "100.999", ""]) {
      const result = createSponsorshipTierSchema.safeParse({
        ...validTier,
        price,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects negative playerSpotsIncluded", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      playerSpotsIncluded: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects playerSpotsIncluded over 20", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      playerSpotsIncluded: 21,
    });
    expect(result.success).toBe(false);
  });

  it("rejects teamSpotsIncluded over 5", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      teamSpotsIncluded: 6,
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable maxQuota", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      maxQuota: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid maxQuota", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      maxQuota: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects maxQuota of 0", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      maxQuota: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxQuota over 100", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      maxQuota: 101,
    });
    expect(result.success).toBe(false);
  });

  it("description is optional", () => {
    const result = createSponsorshipTierSchema.safeParse(validTier);
    expect(result.success).toBe(true);
  });

  it("rejects description over 500 characters", () => {
    const result = createSponsorshipTierSchema.safeParse({
      ...validTier,
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSponsorshipTierSchema", () => {
  it("accepts partial data", () => {
    const result = updateSponsorshipTierSchema.safeParse({ name: "Platinum" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateSponsorshipTierSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("does not include tournamentId", () => {
    const result = updateSponsorshipTierSchema.safeParse({
      tournamentId: validUuid,
    });
    // tournamentId should be stripped (omitted from schema)
    if (result.success) {
      expect(result.data).not.toHaveProperty("tournamentId");
    }
  });

  it("validates fields when provided", () => {
    const result = updateSponsorshipTierSchema.safeParse({
      playerSpotsIncluded: -1,
    });
    expect(result.success).toBe(false);
  });
});
