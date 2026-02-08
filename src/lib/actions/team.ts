"use server";

import { getDb } from "@/lib/db";
import { teams, players } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

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
