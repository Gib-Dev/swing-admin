"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Users, Trophy, ChevronUp, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SponsorshipTierForm } from "./sponsorship-tier-form";
import type { CreateSponsorshipTierInput } from "@/lib/validations/sponsorship";

interface SponsorshipTier {
  id: string;
  tournamentId: string;
  name: string;
  description: string | null;
  price: string;
  playerSpotsIncluded: number;
  teamSpotsIncluded: number;
  maxQuota: number | null;
  sortOrder: number;
}

interface SponsorshipTierListProps {
  tournamentId: string;
  tiers: SponsorshipTier[];
  soldMap: Record<string, number>;
  onCreate: (data: CreateSponsorshipTierInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: CreateSponsorshipTierInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onReorder: (tournamentId: string, orderedIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export function SponsorshipTierList({
  tournamentId,
  tiers,
  soldMap,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: SponsorshipTierListProps) {
  const t = useTranslations("sponsorship");
  const tc = useTranslations("common");
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  async function handleDelete() {
    if (!deletingTierId) return;
    setIsDeleting(true);

    try {
      const result = await onDelete(deletingTierId);

      if (result.success) {
        toast.success(t("tierDeleted"));
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsDeleting(false);
      setDeletingTierId(null);
    }
  }

  function handleEdit(tier: SponsorshipTier) {
    setEditingTier(tier);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingTier(null);
  }

  async function handleSubmit(data: CreateSponsorshipTierInput) {
    if (editingTier) {
      return onUpdate(editingTier.id, data);
    }
    return onCreate(data);
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const sorted = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const temp = sorted[index]!;
    sorted[index] = sorted[swapIndex]!;
    sorted[swapIndex] = temp;
    const orderedIds = sorted.map((t) => t.id);

    setIsReordering(true);
    try {
      const result = await onReorder(tournamentId, orderedIds);
      if (!result.success) {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsReordering(false);
    }
  }

  const sortedTiers = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("tiers")}</CardTitle>
            <CardDescription>
              {t("tiersDescription")}
            </CardDescription>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createTier")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-lg border p-4">
            <SponsorshipTierForm
              tournamentId={tournamentId}
              initialData={
                editingTier
                  ? {
                      id: editingTier.id,
                      name: editingTier.name,
                      description: editingTier.description ?? "",
                      price: editingTier.price,
                      playerSpotsIncluded: editingTier.playerSpotsIncluded,
                      teamSpotsIncluded: editingTier.teamSpotsIncluded,
                      maxQuota: editingTier.maxQuota,
                      sortOrder: editingTier.sortOrder,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {sortedTiers.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("noTiers")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTiers.map((tier, index) => (
              <div
                key={tier.id}
                className="flex items-center gap-2 rounded-lg border p-4"
              >
                {sortedTiers.length > 1 && (
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMove(index, "up")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === sortedTiers.length - 1 || isReordering}
                      onClick={() => handleMove(index, "down")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tier.name}</h4>
                    <span className="text-sm font-semibold text-primary">
                      ${tier.price}
                    </span>
                  </div>
                  {tier.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {tier.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {tier.playerSpotsIncluded > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tier.playerSpotsIncluded} {t("playerSpots").toLowerCase()}
                      </span>
                    )}
                    {tier.teamSpotsIncluded > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tier.teamSpotsIncluded} {t("teamSpots").toLowerCase()}
                      </span>
                    )}
                  </div>
                  <QuotaBar
                    sold={soldMap[tier.id] ?? 0}
                    maxQuota={tier.maxQuota}
                    t={t}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(tier)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingTierId(tier.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingTierId} onOpenChange={(open) => !open && setDeletingTierId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTierTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTierConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function QuotaBar({
  sold,
  maxQuota,
  t,
}: {
  sold: number;
  maxQuota: number | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (maxQuota === null) {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        {t("soldCount", { sold })} &middot; {t("unlimited")}
      </div>
    );
  }

  const percentage = maxQuota > 0 ? Math.min((sold / maxQuota) * 100, 100) : 0;
  const isSoldOut = sold >= maxQuota;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {t("quotaRemaining", {
            remaining: Math.max(maxQuota - sold, 0),
            total: maxQuota,
          })}
        </span>
        {isSoldOut && (
          <span className="font-medium text-destructive">{t("soldOut")}</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            isSoldOut
              ? "bg-destructive"
              : percentage > 75
                ? "bg-yellow-500"
                : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
