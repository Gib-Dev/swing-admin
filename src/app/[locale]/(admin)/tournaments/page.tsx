import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Plus } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tournament" });
  return {
    title: t("title"),
  };
}

export default async function TournamentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tournament");
  const tCommon = await getTranslations("common");

  const db = getDb();
  const allTournaments = await db.query.tournaments.findMany({
    orderBy: [desc(tournaments.startDate)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            Manage your golf tournaments
          </p>
        </div>
        <Link href="/tournaments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {allTournaments.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allTournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}` as "/tournaments"}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">
                      {tournament.name}
                    </CardTitle>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        tournament.registrationOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tournament.registrationOpen
                        ? t("openRegistration")
                        : t("closeRegistration")}
                    </span>
                  </div>
                  {tournament.description && (
                    <CardDescription className="line-clamp-2">
                      {tournament.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString(
                          locale,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>0 / {tournament.maxTeams} teams</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <CalendarDays className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{t("noTournaments")}</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Get started by creating your first tournament.
      </p>
      <Link href="/tournaments/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </Link>
    </Card>
  );
}
