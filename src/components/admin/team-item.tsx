"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
}

interface TeamItemProps {
  team: {
    id: string;
    code: string;
    name: string | null;
    players: Player[];
  };
  onUpdateName: (teamId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (teamId: string) => void;
  onMovePlayer: (playerId: string, playerName: string, currentTeamId: string) => void;
}

export function TeamItem({ team, onUpdateName, onDelete, onMovePlayer }: TeamItemProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const playerCount = team.players.length;
  const statusLabel = playerCount === 0 ? t("empty") : playerCount >= 4 ? t("full") : t("incomplete");
  const statusColor =
    playerCount === 0
      ? "bg-muted text-muted-foreground"
      : playerCount >= 4
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(team.code);
      toast.success(t("codeCopied"));
    } catch {
      toast.error(tc("error"));
    }
  }

  async function handleSaveName() {
    setIsSaving(true);
    try {
      const result = await onUpdateName(team.id, editName.trim());
      if (result.success) {
        toast.success(t("teamUpdated"));
        setIsEditing(false);
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditName(team.name ?? "");
    setIsEditing(false);
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 p-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
              {team.code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyCode}
            >
              <Copy className="h-3 w-3" />
            </Button>

            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 w-40 text-sm"
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveName} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                {team.name && (
                  <span className="text-sm font-medium truncate">{team.name}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setEditName(team.name ?? ""); setIsEditing(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {t("playersCount", { count: playerCount })} · {statusLabel}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(team.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {expanded && team.players.length > 0 && (
        <div className="border-t px-4 py-2">
          <div className="space-y-2">
            {team.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{player.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onMovePlayer(player.id, `${player.firstName} ${player.lastName}`, team.id)
                  }
                >
                  <ArrowRightLeft className="mr-1 h-3 w-3" />
                  {t("movePlayer")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && team.players.length === 0 && (
        <div className="border-t px-4 py-4 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}
    </div>
  );
}
