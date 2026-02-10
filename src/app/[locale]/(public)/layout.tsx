import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
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

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SwingAdmin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
