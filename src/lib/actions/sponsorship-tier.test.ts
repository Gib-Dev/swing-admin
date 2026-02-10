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
  createSponsorshipTier,
  updateSponsorshipTier,
  deleteSponsorshipTier,
  reorderSponsorshipTiers,
} from "./sponsorship-tier";
import { revalidatePath } from "next/cache";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

const validTier = {
  tournamentId: validUuid,
  name: "Gold Sponsor",
  price: "5000.00",
  playerSpotsIncluded: 4,
  teamSpotsIncluded: 1,
  sortOrder: 0,
};

beforeEach(() => {
  mockDb = createMockDb();
});

describe("createSponsorshipTier", () => {
  it("creates tier when authenticated", async () => {
    mockAuthSuccess();

    const result = await createSponsorshipTier(validTier);

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(`/tournaments/${validUuid}`);
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await createSponsorshipTier(validTier);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for invalid data", async () => {
    mockAuthSuccess();

    const result = await createSponsorshipTier({
      ...validTier,
      name: "",
    });

    expect(result).toEqual({ success: false, error: "Invalid data" });
  });
});

describe("updateSponsorshipTier", () => {
  it("updates tier when found", async () => {
    mockAuthSuccess();
    mockDb.query.sponsorshipTiers.findFirst.mockResolvedValue({
      id: "tier-1",
      tournamentId: validUuid,
    });

    const result = await updateSponsorshipTier("tier-1", { name: "Platinum" });

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(`/tournaments/${validUuid}`);
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await updateSponsorshipTier("tier-1", { name: "Platinum" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tier not found", async () => {
    mockAuthSuccess();
    mockDb.query.sponsorshipTiers.findFirst.mockResolvedValue(null);

    const result = await updateSponsorshipTier("tier-1", { name: "Platinum" });

    expect(result).toEqual({
      success: false,
      error: "Sponsorship tier not found",
    });
  });
});

describe("deleteSponsorshipTier", () => {
  it("deletes tier when found", async () => {
    mockAuthSuccess();
    mockDb.query.sponsorshipTiers.findFirst.mockResolvedValue({
      id: "tier-1",
      tournamentId: validUuid,
    });

    const result = await deleteSponsorshipTier("tier-1");

    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(`/tournaments/${validUuid}`);
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await deleteSponsorshipTier("tier-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when tier not found", async () => {
    mockAuthSuccess();
    mockDb.query.sponsorshipTiers.findFirst.mockResolvedValue(null);

    const result = await deleteSponsorshipTier("tier-1");

    expect(result).toEqual({
      success: false,
      error: "Sponsorship tier not found",
    });
  });
});

describe("reorderSponsorshipTiers", () => {
  it("reorders tiers when authenticated", async () => {
    mockAuthSuccess();

    const result = await reorderSponsorshipTiers(validUuid, [
      "tier-1",
      "tier-2",
      "tier-3",
    ]);

    expect(result.success).toBe(true);
    // update called once per tier
    expect(mockDb.update).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenCalledWith(`/tournaments/${validUuid}`);
  });

  it("returns error when not authenticated", async () => {
    mockAuthUnauthorized();

    const result = await reorderSponsorshipTiers(validUuid, ["tier-1"]);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });
});
