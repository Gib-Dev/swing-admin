import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-bold">SwingAdmin</span>
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main — no container so home page hero can be full-bleed */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0a2918] text-white">
        <div className="container mx-auto px-4 pb-8 pt-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Logo
                  size={28}
                  className="[&_ellipse]:fill-white [&_path]:fill-white [&_rect]:fill-white"
                />
                <span className="text-lg font-bold">SwingAdmin</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-white/60">
                {t("footerTagline")}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                {t("footerQuickLinks")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/register?type=employee"
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {t("footerRegisterEmployee")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register?type=sponsor"
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {t("footerRegisterSponsor")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {t("footerAdminLogin")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Language */}
            <div className="flex items-start lg:justify-end">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/35">
            &copy; {new Date().getFullYear()} SwingAdmin.{" "}
            {t("footerRights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
