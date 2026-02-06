import { getTranslations, setRequestLocale } from "next-intl/server";
import { TournamentForm } from "@/components/admin/tournament-form";
import { createTournament } from "@/lib/actions/tournament";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tournament" });
  return {
    title: t("create"),
  };
}

export default async function NewTournamentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TournamentForm onSubmit={createTournament} />
    </div>
  );
}
