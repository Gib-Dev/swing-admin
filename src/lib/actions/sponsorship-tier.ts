"use server";

import { getDb } from "@/lib/db";
import { sponsorshipTiers } from "@/lib/db/schema";
import {
  createSponsorshipTierSchema,
  updateSponsorshipTierSchema,
  type CreateSponsorshipTierInput,
  type UpdateSponsorshipTierInput,
} from "@/lib/validations/sponsorship";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";

export async function createSponsorshipTier(
  data: CreateSponsorshipTierInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createSponsorshipTierSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Invalid data" };
    }

    const db = getDb();

    await db.insert(sponsorshipTiers).values({
      tournamentId: validated.data.tournamentId,
      name: validated.data.name,
      description: validated.data.description ?? null,
      price: validated.data.price,
      playerSpotsIncluded: validated.data.playerSpotsIncluded,
      teamSpotsIncluded: validated.data.teamSpotsIncluded,
      maxQuota: validated.data.maxQuota ?? null,
      sortOrder: validated.data.sortOrder,
    });

    revalidatePath(`/tournaments/${validated.data.tournamentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to create sponsorship tier:", error);
    return { success: false, error: "Failed to create sponsorship tier" };
  }
}

export async function updateSponsorshipTier(
  id: string,
  data: UpdateSponsorshipTierInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateSponsorshipTierSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Invalid data" };
    }

    const db = getDb();

    const existing = await db.query.sponsorshipTiers.findFirst({
      where: eq(sponsorshipTiers.id, id),
    });

    if (!existing) {
      return { success: false, error: "Sponsorship tier not found" };
    }

    await db
      .update(sponsorshipTiers)
      .set({
        ...validated.data,
        description: validated.data.description ?? null,
        maxQuota: validated.data.maxQuota ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sponsorshipTiers.id, id));

    revalidatePath(`/tournaments/${existing.tournamentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update sponsorship tier:", error);
    return { success: false, error: "Failed to update sponsorship tier" };
  }
}

export async function reorderSponsorshipTiers(
  tournamentId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(sponsorshipTiers)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(
            and(
              eq(sponsorshipTiers.id, id),
              eq(sponsorshipTiers.tournamentId, tournamentId)
            )
          )
      )
    );

    revalidatePath(`/tournaments/${tournamentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to reorder sponsorship tiers:", error);
    return { success: false, error: "Failed to reorder tiers" };
  }
}

export async function deleteSponsorshipTier(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const existing = await db.query.sponsorshipTiers.findFirst({
      where: eq(sponsorshipTiers.id, id),
    });

    if (!existing) {
      return { success: false, error: "Sponsorship tier not found" };
    }

    await db.delete(sponsorshipTiers).where(eq(sponsorshipTiers.id, id));

    revalidatePath(`/tournaments/${existing.tournamentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete sponsorship tier:", error);
    return { success: false, error: "Failed to delete sponsorship tier" };
  }
}
