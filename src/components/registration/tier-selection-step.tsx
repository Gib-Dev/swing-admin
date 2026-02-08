"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  description: string | null;
  price: string;
  playerSpotsIncluded: number;
  teamSpotsIncluded: number;
  maxQuota: number | null;
  soldCount: number;
}

interface TierSelectionStepProps {
  tiers: Tier[];
  selectedTierIds: string[];
  onToggleTier: (tierId: string) => void;
  currency: string;
  locale: string;
}

export function TierSelectionStep({
  tiers,
  selectedTierIds,
  onToggleTier,
  currency,
  locale,
}: TierSelectionStepProps) {
  const t = useTranslations("sponsorship");
  const tReg = useTranslations("registration");

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency,
    }).format(parseFloat(amount));
  };

  const totalAmount = tiers
    .filter((tier) => selectedTierIds.includes(tier.id))
    .reduce((sum, tier) => sum + parseFloat(tier.price), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => {
          const isSelected = selectedTierIds.includes(tier.id);
          const isSoldOut =
            tier.maxQuota !== null && tier.soldCount >= tier.maxQuota;
          const remaining =
            tier.maxQuota !== null ? tier.maxQuota - tier.soldCount : null;

          return (
            <button
              key={tier.id}
              type="button"
              disabled={isSoldOut}
              onClick={() => onToggleTier(tier.id)}
              className={cn(
                "relative rounded-xl border-2 p-6 text-left transition-all",
                isSelected && "border-primary bg-primary/5 shadow-md",
                !isSelected && !isSoldOut && "border-border hover:border-primary/50",
                isSoldOut && "cursor-not-allowed border-muted bg-muted/30 opacity-60"
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <h3 className="mb-1 text-lg font-semibold">{tier.name}</h3>
              {tier.description && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {tier.description}
                </p>
              )}

              <p className="mb-3 text-2xl font-bold text-primary">
                {formatCurrency(tier.price)}
              </p>

              <div className="space-y-1 text-sm text-muted-foreground">
                {tier.playerSpotsIncluded > 0 && (
                  <p>
                    {t("playerSpots")}: {tier.playerSpotsIncluded}
                  </p>
                )}
                {tier.teamSpotsIncluded > 0 && (
                  <p>
                    {t("teamSpots")}: {tier.teamSpotsIncluded}
                  </p>
                )}
              </div>

              {/* Quota info */}
              {tier.maxQuota !== null && (
                <div className="mt-3">
                  {isSoldOut ? (
                    <span className="inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {t("soldOut")}
                    </span>
                  ) : (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>
                          {t("quotaRemaining", {
                            remaining: remaining ?? 0,
                            total: tier.maxQuota,
                          })}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${((tier.maxQuota - (remaining ?? 0)) / tier.maxQuota) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Running total */}
      {selectedTierIds.length > 0 && (
        <div className="rounded-lg border bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{tReg("totalAmount")}</span>
            <span className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
                style: "currency",
                currency,
              }).format(totalAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
