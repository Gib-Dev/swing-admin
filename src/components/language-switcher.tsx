"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-1">
      {locales.map((l) => (
        <Button
          key={l}
          variant={locale === l ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => switchLocale(l)}
        >
          {localeNames[l]}
        </Button>
      ))}
    </div>
  );
}
