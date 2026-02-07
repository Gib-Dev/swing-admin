import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserList } from "@/components/admin/user-list";
import { createUser, deleteUser } from "@/lib/actions/user";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "users" });
  return {
    title: t("title"),
  };
}

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const db = getDb();
  const allUsers = await db.query.users.findMany({
    orderBy: [asc(users.createdAt)],
  });

  const userList = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <UserList
        users={userList}
        currentUserId={session.user.id}
        onCreate={createUser}
        onDelete={deleteUser}
      />
    </div>
  );
}
