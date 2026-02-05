"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AdminHeader() {
  const t = useTranslations("auth");

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="text-lg font-bold">SwingAdmin</span>
        </div>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          {t("logout")}
        </Button>
      </div>
    </header>
  );
}
