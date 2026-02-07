"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Users, Trophy } from "lucide-react";

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
  onCreate: (data: CreateSponsorshipTierInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: CreateSponsorshipTierInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function SponsorshipTierList({
  tournamentId,
  tiers,
  onCreate,
  onUpdate,
  onDelete,
}: SponsorshipTierListProps) {
  const t = useTranslations("sponsorship");
  const tc = useTranslations("common");
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            {sortedTiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
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
                    {tier.maxQuota !== null && (
                      <span>
                        {t("quotaLabel", { quota: tier.maxQuota })}
                      </span>
                    )}
                  </div>
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
