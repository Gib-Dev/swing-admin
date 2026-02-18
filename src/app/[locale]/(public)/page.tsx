import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/logo";
import { getDb } from "@/lib/db";
import { teams, players, sponsorships, tournaments } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

async function getPublicStats() {
  try {
    const db = getDb();
    const [teamsRow, playersRow, sponsorsRow, tournament] = await Promise.all([
      db.select({ count: count() }).from(teams),
      db.select({ count: count() }).from(players),
      db.select({ count: count() }).from(sponsorships),
      db.query.tournaments.findFirst({
        where: eq(tournaments.registrationOpen, true),
        columns: {
          id: true,
          name: true,
          location: true,
          startDate: true,
          endDate: true,
        },
      }),
    ]);
    return {
      teamsCount: teamsRow[0]?.count ?? 0,
      playersCount: playersRow[0]?.count ?? 0,
      sponsorsCount: sponsorsRow[0]?.count ?? 0,
      tournament: tournament ?? null,
    };
  } catch {
    return { teamsCount: 0, playersCount: 0, sponsorsCount: 0, tournament: null };
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tReg, stats] = await Promise.all([
    getTranslations("home"),
    getTranslations("registration"),
    getPublicStats(),
  ]);

  const { teamsCount, playersCount, sponsorsCount, tournament } = stats;

  const dateStr = tournament
    ? new Date(tournament.startDate).toLocaleDateString(
        locale === "fr" ? "fr-CA" : "en-CA",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : null;

  const statItems = [
    { value: teamsCount, label: t("statsTeams") },
    { value: playersCount, label: t("statsPlayers") },
    { value: sponsorsCount, label: t("statsSponsors") },
  ];

  const employeeBullets = [
    t("employeeCardBullet1"),
    t("employeeCardBullet2"),
    t("employeeCardBullet3"),
  ];

  const sponsorBullets = [
    t("sponsorCardBullet1"),
    t("sponsorCardBullet2"),
    t("sponsorCardBullet3"),
  ];

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#0a2918] via-[#0f3d22] to-[#071209] px-4 py-24 text-white sm:py-32">
        {/* Large watermark logo */}
        <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 opacity-[0.04]">
          <Logo
            size={480}
            className="[&_ellipse]:fill-white [&_path]:fill-white [&_rect]:fill-white"
          />
        </div>
        {/* Dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative container mx-auto max-w-4xl">
          <span className="mb-5 inline-block rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-green-300">
            {t("heroEyebrow")}
          </span>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            {tournament?.name ?? t("heroTitleFallback")}
          </h1>

          {tournament && (
            <p className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/65">
              <span className="flex items-center gap-1.5">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {tournament.location}
              </span>
              {dateStr && (
                <span className="flex items-center gap-1.5">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {dateStr}
                </span>
              )}
            </p>
          )}

          <p className="mb-10 max-w-lg text-lg leading-relaxed text-white/75">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register?type=employee"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#0a2918] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl active:scale-95"
            >
              {t("employeeCta")}
            </Link>
            <Link
              href="/register?type=sponsor"
              className="rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
            >
              {t("sponsorCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ────────────────────────────────────────── */}
      <section className="border-b bg-card shadow-sm">
        <div className="container mx-auto grid grid-cols-3 divide-x">
          {statItems.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-7 sm:py-9">
              <span className="text-3xl font-extrabold tabular-nums text-primary sm:text-4xl">
                {value}
              </span>
              <span className="mt-1 text-center text-xs text-muted-foreground sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Registration cards ───────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("howToJoin")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("howToJoinSubtitle")}</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {/* Employee card */}
            <Link href="/register?type=employee" className="group block">
              <div className="flex h-full flex-col rounded-2xl border-2 border-border bg-card p-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary group-hover:shadow-2xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <Logo size={36} />
                </div>
                <h3 className="mb-2 text-2xl font-bold">{t("employeeCardTitle")}</h3>
                <p className="mb-6 text-muted-foreground">
                  {tReg("employeeDescription")}
                </p>
                <ul className="mb-8 space-y-2.5 text-sm text-muted-foreground">
                  {employeeBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-primary"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-2 font-semibold text-primary">
                  {t("employeeCta")}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Sponsor card */}
            <Link href="/register?type=sponsor" className="group block">
              <div className="flex h-full flex-col rounded-2xl border-2 border-border bg-card p-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary group-hover:shadow-2xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold">{t("sponsorCardTitle")}</h3>
                <p className="mb-6 text-muted-foreground">
                  {tReg("sponsorDescription")}
                </p>
                <ul className="mb-8 space-y-2.5 text-sm text-muted-foreground">
                  {sponsorBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-primary"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-2 font-semibold text-primary">
                  {t("sponsorCta")}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
