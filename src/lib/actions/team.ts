"use server";

import { getDb } from "@/lib/db";
import { teams, players } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes O/0/I/1

export async function generateTeamCode(): Promise<string> {
  const db = getDb();
  let code: string;
  let exists = true;

  // Generate until unique
  while (exists) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
    }
    const existing = await db.query.teams.findFirst({
      where: eq(teams.code, code),
    });
    exists = !!existing;
  }

  return code!;
}

export async function validateTeamCode(
  tournamentId: string,
  code: string
): Promise<{ valid: boolean; error?: string; teamId?: string }> {
  try {
    const db = getDb();

    const team = await db.query.teams.findFirst({
      where: and(eq(teams.code, code), eq(teams.tournamentId, tournamentId)),
    });

    if (!team) {
      return { valid: false, error: "Team not found" };
    }

    // Count players on this team
    const rows = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(players)
      .where(eq(players.teamId, team.id));

    if (rows[0]!.count >= 4) {
      return { valid: false, error: "Team is full (4/4 players)" };
    }

    return { valid: true, teamId: team.id };
  } catch (error) {
    console.error("Failed to validate team code:", error);
    return { valid: false, error: "Failed to validate team code" };
  }
}

export async function createTeamForTournament(
  tournamentId: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();
    const code = await generateTeamCode();

    await db.insert(teams).values({
      tournamentId,
      code,
      name: name || null,
    });

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create team:", error);
    return { success: false, error: "Failed to create team" };
  }
}

export async function updateTeamName(
  teamId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const existing = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!existing) {
      return { success: false, error: "Team not found" };
    }

    await db
      .update(teams)
      .set({ name: name || null, updatedAt: new Date() })
      .where(eq(teams.id, teamId));

    revalidatePath(`/tournaments/${existing.tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update team:", error);
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const existing = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!existing) {
      return { success: false, error: "Team not found" };
    }

    // onDelete: "set null" on players.teamId handles unassigning players
    await db.delete(teams).where(eq(teams.id, teamId));

    revalidatePath(`/tournaments/${existing.tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
}

export async function movePlayerToTeam(
  playerId: string,
  targetTeamId: string | null,
  tournamentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    // Verify player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return { success: false, error: "Player not found" };
    }

    // If assigning to a team, validate capacity
    if (targetTeamId) {
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, targetTeamId), eq(teams.tournamentId, tournamentId)),
      });

      if (!team) {
        return { success: false, error: "Team not found" };
      }

      const rows = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(players)
        .where(eq(players.teamId, targetTeamId));

      if (rows[0]!.count >= 4) {
        return { success: false, error: "Team is full (4/4 players)" };
      }
    }

    await db
      .update(players)
      .set({ teamId: targetTeamId, updatedAt: new Date() })
      .where(eq(players.id, playerId));

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to move player:", error);
    return { success: false, error: "Failed to move player" };
  }
}

export async function getTeamsWithPlayers(tournamentId: string) {
  const db = getDb();

  const teamsData = await db.query.teams.findMany({
    where: eq(teams.tournamentId, tournamentId),
    with: {
      players: true,
    },
    orderBy: (teams, { asc }) => [asc(teams.createdAt)],
  });

  return teamsData;
}

export async function getUnassignedPlayers(tournamentId: string) {
  const db = getDb();

  // Find players whose registration belongs to this tournament and have no team
  const unassigned = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      email: players.email,
      phone: players.phone,
      title: players.title,
    })
    .from(players)
    .innerJoin(
      sql`registrations`,
      sql`registrations.id = ${players.registrationId}`
    )
    .where(
      and(
        isNull(players.teamId),
        sql`registrations.tournament_id = ${tournamentId}`
      )
    );

  return unassigned;
}
