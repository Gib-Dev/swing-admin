import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/lib/db";
import { tournaments, sponsorshipTiers, sponsorships } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { EmployeeRegistrationForm } from "@/components/registration/employee-registration-form";
import { SponsorRegistrationForm } from "@/components/registration/sponsor-registration-form";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; tournament?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("registration");
  const { type, tournament: tournamentId } = await searchParams;

  const db = getDb();

  // Fetch tournament (specific or first open one)
  let tournament;
  if (tournamentId) {
    tournament = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, tournamentId),
        eq(tournaments.registrationOpen, true)
      ),
    });
  } else {
    tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.registrationOpen, true),
    });
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">{t("registrationClosed")}</h1>
        <p className="text-muted-foreground">{t("noOpenTournament")}</p>
      </div>
    );
  }

  if (type === "sponsor") {
    // Fetch tiers with sold counts
    const tiers = await db
      .select({
        id: sponsorshipTiers.id,
        name: sponsorshipTiers.name,
        description: sponsorshipTiers.description,
        price: sponsorshipTiers.price,
        playerSpotsIncluded: sponsorshipTiers.playerSpotsIncluded,
        teamSpotsIncluded: sponsorshipTiers.teamSpotsIncluded,
        maxQuota: sponsorshipTiers.maxQuota,
        sortOrder: sponsorshipTiers.sortOrder,
        soldCount: sql<number>`cast(count(${sponsorships.id}) as int)`,
      })
      .from(sponsorshipTiers)
      .leftJoin(
        sponsorships,
        eq(sponsorshipTiers.id, sponsorships.sponsorshipTierId)
      )
      .where(eq(sponsorshipTiers.tournamentId, tournament.id))
      .groupBy(sponsorshipTiers.id)
      .orderBy(sponsorshipTiers.sortOrder);

    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{t("sponsorTitle")}</h1>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
        <SponsorRegistrationForm
          tournament={{
            id: tournament.id,
            name: tournament.name,
            currency: tournament.currency,
          }}
          tiers={tiers}
          locale={locale}
        />
      </div>
    );
  }

  // Default: employee registration
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">{t("employeeTitle")}</h1>
        <p className="text-muted-foreground">{tournament.name}</p>
      </div>
      <EmployeeRegistrationForm
        tournament={{
          id: tournament.id,
          name: tournament.name,
          price: tournament.employeeRegistrationPrice,
          currency: tournament.currency,
        }}
        locale={locale}
      />
    </div>
  );
}
