"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TournamentFilters() {
  const t = useTranslations("tournament");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const search = params.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    startTransition(() => {
      router.replace(url as "/tournaments");
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        <Input
          placeholder={t("searchPlaceholder")}
          defaultValue={query}
          onChange={(e) => updateParams("q", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(v) => updateParams("status", v)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={tc("filter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filterAll")}</SelectItem>
          <SelectItem value="open">{t("filterOpen")}</SelectItem>
          <SelectItem value="closed">{t("filterClosed")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
