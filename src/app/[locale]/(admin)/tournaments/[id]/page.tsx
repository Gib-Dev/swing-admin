import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { tournaments, sponsorshipTiers, sponsorships } from "@/lib/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { TournamentForm } from "@/components/admin/tournament-form";
import { RegistrationToggle } from "@/components/admin/registration-toggle";
import { DeleteTournamentButton } from "@/components/admin/delete-tournament-button";
import { SponsorshipTierList } from "@/components/admin/sponsorship-tier-list";
import { updateTournament, toggleRegistration, deleteTournament } from "@/lib/actions/tournament";
import {
  createSponsorshipTier,
  updateSponsorshipTier,
  deleteSponsorshipTier,
  reorderSponsorshipTiers,
} from "@/lib/actions/sponsorship-tier";
import type { CreateTournamentInput } from "@/lib/validations/tournament";
import type { CreateSponsorshipTierInput } from "@/lib/validations/sponsorship";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "tournament" });

  const db = getDb();
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });

  if (!tournament) {
    return { title: "Not Found" };
  }

  return {
    title: `${t("edit")} - ${tournament.name}`,
  };
}

export default async function TournamentEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const db = getDb();

  const [tournament, tiers, soldCounts] = await Promise.all([
    db.query.tournaments.findFirst({
      where: eq(tournaments.id, id),
    }),
    db.query.sponsorshipTiers.findMany({
      where: eq(sponsorshipTiers.tournamentId, id),
      orderBy: [asc(sponsorshipTiers.sortOrder)],
    }),
    db
      .select({
        sponsorshipTierId: sponsorships.sponsorshipTierId,
        sold: count(),
      })
      .from(sponsorships)
      .innerJoin(
        sponsorshipTiers,
        eq(sponsorships.sponsorshipTierId, sponsorshipTiers.id)
      )
      .where(eq(sponsorshipTiers.tournamentId, id))
      .groupBy(sponsorships.sponsorshipTierId),
  ]);

  const soldMap: Record<string, number> = {};
  for (const row of soldCounts) {
    soldMap[row.sponsorshipTierId] = row.sold;
  }

  if (!tournament) {
    notFound();
  }

  const initialData: Partial<CreateTournamentInput> & { id: string } = {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description ?? "",
    location: tournament.location,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    maxTeams: tournament.maxTeams,
    employeeRegistrationPrice: tournament.employeeRegistrationPrice,
    currency: tournament.currency as "CAD" | "USD",
  };

  async function handleUpdate(data: CreateTournamentInput) {
    "use server";
    return updateTournament(id, data);
  }

  async function handleUpdateTier(tierId: string, data: CreateSponsorshipTierInput) {
    "use server";
    return updateSponsorshipTier(tierId, data);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <RegistrationToggle
          tournamentId={tournament.id}
          isOpen={tournament.registrationOpen}
          onToggle={toggleRegistration}
        />
        <DeleteTournamentButton
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          onDelete={deleteTournament}
        />
      </div>
      <TournamentForm initialData={initialData} onSubmit={handleUpdate} />
      <SponsorshipTierList
        tournamentId={tournament.id}
        tiers={tiers}
        soldMap={soldMap}
        onCreate={createSponsorshipTier}
        onUpdate={handleUpdateTier}
        onDelete={deleteSponsorshipTier}
        onReorder={reorderSponsorshipTiers}
      />
    </div>
  );
}
