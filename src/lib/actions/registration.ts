"use server";

import { getDb } from "@/lib/db";
import {
  tournaments,
  registrations,
  players,
  teams,
  payments,
  sponsorships,
  sponsorshipTiers,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  employeeRegistrationSchema,
  sponsorRegistrationSchema,
  type EmployeeRegistrationInput,
  type SponsorRegistrationInput,
} from "@/lib/validations/registration";
import { generateTeamCode } from "./team";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export async function createEmployeeRegistration(
  data: EmployeeRegistrationInput & { locale?: string }
): Promise<{ success: boolean; error?: string; registrationId?: string; checkoutUrl?: string | null }> {
  try {
    const validated = employeeRegistrationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: "Invalid registration data" };
    }

    const db = getDb();
    const { tournamentId, player, teamOption } = validated.data;

    // Verify tournament exists and registration is open
    const tournament = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.registrationOpen, true)
      ),
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found or registration closed" };
    }

    // Use a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Create registration
      const registrationRows = await tx
        .insert(registrations)
        .values({
          tournamentId,
          type: "employee",
          totalAmount: tournament.employeeRegistrationPrice,
          currency: tournament.currency,
          locale: data.locale ?? "en",
        })
        .returning();
      const registration = registrationRows[0]!;

      let teamId: string | null = null;

      if (teamOption.type === "create") {
        // Generate team code and create team
        const code = await generateTeamCode();
        const teamRows = await tx
          .insert(teams)
          .values({
            tournamentId,
            code,
            name: teamOption.teamName || null,
            createdByRegistrationId: registration.id,
          })
          .returning();
        teamId = teamRows[0]!.id;
      } else {
        // Join existing team - re-validate to prevent race conditions
        const existingTeam = await tx.query.teams.findFirst({
          where: and(
            eq(teams.code, teamOption.teamCode),
            eq(teams.tournamentId, tournamentId)
          ),
        });

        if (!existingTeam) {
          throw new Error("Team not found");
        }

        const playerCountRows = await tx
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(players)
          .where(eq(players.teamId, existingTeam.id));

        if (playerCountRows[0]!.count >= 4) {
          throw new Error("Team is full");
        }

        teamId = existingTeam.id;
      }

      // Insert player
      await tx.insert(players).values({
        registrationId: registration.id,
        teamId,
        title: player.title,
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        phone: player.phone,
        birthDate: player.birthDate ?? null,
        addressLine1: player.addressLine1,
        addressLine2: player.addressLine2 ?? null,
        city: player.city,
        province: player.province,
        postalCode: player.postalCode,
        country: player.country,
      });

      // Insert payment (pending — Stripe integration in Sprint 4)
      await tx.insert(payments).values({
        registrationId: registration.id,
        amount: tournament.employeeRegistrationPrice,
        currency: tournament.currency,
        status: "pending",
      });

      return { registrationId: registration.id };
    });

    // Attempt to create Stripe checkout session
    const checkout = await createCheckoutSession({
      registrationId: result.registrationId,
      amount: parseFloat(tournament.employeeRegistrationPrice),
      currency: tournament.currency,
      tournamentName: tournament.name,
      type: "employee",
      locale: data.locale ?? "en",
    });

    return {
      success: true,
      registrationId: result.registrationId,
      checkoutUrl: checkout?.url ?? null,
    };
  } catch (error) {
    console.error("Failed to create employee registration:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create registration";
    return { success: false, error: message };
  }
}

export async function createSponsorRegistration(
  data: SponsorRegistrationInput & { locale?: string }
): Promise<{ success: boolean; error?: string; registrationId?: string; checkoutUrl?: string | null }> {
  try {
    const validated = sponsorRegistrationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: "Invalid registration data" };
    }

    const db = getDb();
    const { tournamentId, selectedTiers, company, players: playerList } =
      validated.data;

    // Verify tournament and registration open
    const tournament = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.registrationOpen, true)
      ),
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found or registration closed" };
    }

    // Fetch selected tiers to calculate total
    const tiers = await db.query.sponsorshipTiers.findMany({
      where: eq(sponsorshipTiers.tournamentId, tournamentId),
    });

    const selectedTierData = tiers.filter((tier) =>
      selectedTiers.includes(tier.id)
    );

    if (selectedTierData.length !== selectedTiers.length) {
      return { success: false, error: "One or more selected tiers not found" };
    }

    // Calculate total amount
    const totalAmount = selectedTierData
      .reduce((sum, tier) => sum + parseFloat(tier.price), 0)
      .toFixed(2);

    const result = await db.transaction(async (tx) => {
      // Check quota for each tier (race condition protection inside tx)
      for (const tier of selectedTierData) {
        if (tier.maxQuota !== null) {
          const soldRows = await tx
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(sponsorships)
            .where(eq(sponsorships.sponsorshipTierId, tier.id));

          if (soldRows[0]!.count >= tier.maxQuota) {
            throw new Error(`Tier "${tier.name}" is sold out`);
          }
        }
      }

      // Create registration
      const regRows = await tx
        .insert(registrations)
        .values({
          tournamentId,
          type: "sponsor",
          totalAmount,
          currency: tournament.currency,
          locale: data.locale ?? "en",
        })
        .returning();
      const registration = regRows[0]!;

      // Create sponsorship records for each tier
      for (const tier of selectedTierData) {
        await tx.insert(sponsorships).values({
          registrationId: registration.id,
          sponsorshipTierId: tier.id,
          companyName: company.companyName,
          contactName: company.contactName,
          contactTitle: company.contactTitle ?? null,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          addressLine1: company.addressLine1,
          addressLine2: company.addressLine2 ?? null,
          city: company.city,
          province: company.province,
          postalCode: company.postalCode,
          country: company.country,
        });
      }

      // Insert players (if any)
      if (playerList && playerList.length > 0) {
        for (const player of playerList) {
          await tx.insert(players).values({
            registrationId: registration.id,
            teamId: null,
            title: player.title,
            firstName: player.firstName,
            lastName: player.lastName,
            email: player.email,
            phone: player.phone,
            birthDate: player.birthDate ?? null,
            addressLine1: player.addressLine1,
            addressLine2: player.addressLine2 ?? null,
            city: player.city,
            province: player.province,
            postalCode: player.postalCode,
            country: player.country,
          });
        }
      }

      // Insert payment
      await tx.insert(payments).values({
        registrationId: registration.id,
        amount: totalAmount,
        currency: tournament.currency,
        status: "pending",
      });

      return { registrationId: registration.id };
    });

    // Attempt to create Stripe checkout session
    const checkout = await createCheckoutSession({
      registrationId: result.registrationId,
      amount: parseFloat(totalAmount),
      currency: tournament.currency,
      tournamentName: tournament.name,
      type: "sponsor",
      locale: data.locale ?? "en",
    });

    return {
      success: true,
      registrationId: result.registrationId,
      checkoutUrl: checkout?.url ?? null,
    };
  } catch (error) {
    console.error("Failed to create sponsor registration:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create registration";
    return { success: false, error: message };
  }
}
