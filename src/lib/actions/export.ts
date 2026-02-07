"use server";

import { getDb } from "@/lib/db";
import { tournaments, teams, players, registrations, sponsorshipTiers, sponsorships } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function exportTournamentsCsv(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const allTournaments = await db.query.tournaments.findMany({
      orderBy: [desc(tournaments.startDate)],
      with: {
        teams: true,
        registrations: true,
        sponsorshipTiers: true,
      },
    });

    const headers = [
      "Name",
      "Location",
      "Start Date",
      "End Date",
      "Max Teams",
      "Current Teams",
      "Registrations",
      "Sponsorship Tiers",
      "Registration Price",
      "Currency",
      "Registration Open",
      "Created At",
    ];

    const rows = allTournaments.map((t) => [
      escapeCsv(t.name),
      escapeCsv(t.location),
      t.startDate.toISOString().split("T")[0],
      t.endDate.toISOString().split("T")[0],
      t.maxTeams,
      t.teams.length,
      t.registrations.length,
      t.sponsorshipTiers.length,
      t.employeeRegistrationPrice,
      t.currency,
      t.registrationOpen ? "Yes" : "No",
      t.createdAt.toISOString().split("T")[0],
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return { success: true, data: csv };
  } catch (error) {
    console.error("Failed to export tournaments:", error);
    return { success: false, error: "Failed to export data" };
  }
}

export async function exportTournamentDetailCsv(
  tournamentId: string
): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();

    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentId),
      with: {
        teams: {
          with: {
            players: true,
          },
        },
        registrations: true,
        sponsorshipTiers: {
          with: {
            sponsorships: true,
          },
        },
      },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const headers = [
      "Type",
      "Team Name",
      "Team Code",
      "Player Name",
      "Email",
      "Phone",
      "City",
      "Province",
    ];

    const rows: string[][] = [];

    for (const team of tournament.teams) {
      if (team.players.length === 0) {
        rows.push([
          "Team",
          escapeCsv(team.name ?? ""),
          team.code,
          "",
          "",
          "",
          "",
          "",
        ]);
      } else {
        for (const player of team.players) {
          rows.push([
            "Player",
            escapeCsv(team.name ?? ""),
            team.code,
            escapeCsv(`${player.firstName} ${player.lastName}`),
            escapeCsv(player.email),
            escapeCsv(player.phone),
            escapeCsv(player.city),
            escapeCsv(player.province),
          ]);
        }
      }
    }

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const filename = `${tournament.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.csv`;

    return { success: true, data: csv, filename };
  } catch (error) {
    console.error("Failed to export tournament detail:", error);
    return { success: false, error: "Failed to export data" };
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
