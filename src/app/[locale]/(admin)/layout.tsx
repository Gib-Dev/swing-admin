import { setRequestLocale } from "next-intl/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  return (
    <Providers>
      <div className="flex min-h-screen">
        <AdminSidebar userRole={session?.user?.role} />
        <div className="flex flex-1 flex-col">
          <AdminHeader userRole={session?.user?.role} />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
