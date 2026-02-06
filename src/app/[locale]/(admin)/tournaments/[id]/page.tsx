import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TournamentForm } from "@/components/admin/tournament-form";
import { RegistrationToggle } from "@/components/admin/registration-toggle";
import { updateTournament, toggleRegistration } from "@/lib/actions/tournament";
import type { CreateTournamentInput } from "@/lib/validations/tournament";

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
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <RegistrationToggle
        tournamentId={tournament.id}
        isOpen={tournament.registrationOpen}
        onToggle={toggleRegistration}
      />
      <TournamentForm initialData={initialData} onSubmit={handleUpdate} />
    </div>
  );
}
