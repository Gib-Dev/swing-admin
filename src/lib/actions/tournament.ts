"use server";

import { getDb } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import {
  createTournamentSchema,
  updateTournamentSchema,
  type CreateTournamentInput,
  type UpdateTournamentInput,
} from "@/lib/validations/tournament";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createTournament(
  data: CreateTournamentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createTournamentSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Invalid data" };
    }

    const db = getDb();

    await db.insert(tournaments).values({
      name: validated.data.name,
      description: validated.data.description ?? null,
      location: validated.data.location,
      startDate: validated.data.startDate,
      endDate: validated.data.endDate,
      maxTeams: validated.data.maxTeams,
      employeeRegistrationPrice: validated.data.employeeRegistrationPrice,
      currency: validated.data.currency,
      registrationOpen: false,
    });

    revalidatePath("/tournaments");

    return { success: true };
  } catch (error) {
    console.error("Failed to create tournament:", error);
    return { success: false, error: "Failed to create tournament" };
  }
}

export async function updateTournament(
  id: string,
  data: UpdateTournamentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateTournamentSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Invalid data" };
    }

    const db = getDb();

    const existing = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, id),
    });

    if (!existing) {
      return { success: false, error: "Tournament not found" };
    }

    await db
      .update(tournaments)
      .set({
        ...validated.data,
        description: validated.data.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id));

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update tournament:", error);
    return { success: false, error: "Failed to update tournament" };
  }
}

export async function toggleRegistration(
  id: string
): Promise<{ success: boolean; error?: string; isOpen?: boolean }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const existing = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, id),
    });

    if (!existing) {
      return { success: false, error: "Tournament not found" };
    }

    const newStatus = !existing.registrationOpen;

    await db
      .update(tournaments)
      .set({
        registrationOpen: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id));

    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${id}`);

    return { success: true, isOpen: newStatus };
  } catch (error) {
    console.error("Failed to toggle registration:", error);
    return { success: false, error: "Failed to toggle registration" };
  }
}
