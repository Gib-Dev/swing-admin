"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamOption {
  id: string;
  code: string;
  name: string | null;
  playerCount: number;
}

interface MovePlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  currentTeamId: string | null;
  teams: TeamOption[];
  tournamentId: string;
  playerId: string;
  onMove: (playerId: string, targetTeamId: string | null, tournamentId: string) => Promise<{ success: boolean; error?: string }>;
}

export function MovePlayerDialog({
  open,
  onOpenChange,
  playerName,
  currentTeamId,
  teams,
  tournamentId,
  playerId,
  onMove,
}: MovePlayerDialogProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);

  async function handleMove() {
    if (!selectedTeamId) return;

    setIsMoving(true);
    try {
      const targetId = selectedTeamId === "__unassign__" ? null : selectedTeamId;
      const result = await onMove(playerId, targetId, tournamentId);
      if (result.success) {
        toast.success(t("playerMoved"));
        onOpenChange(false);
        setSelectedTeamId("");
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) setSelectedTeamId(""); onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("movePlayerTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("movePlayerDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="mb-3 text-sm font-medium">{playerName}</p>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectTeam")} />
            </SelectTrigger>
            <SelectContent>
              {currentTeamId && (
                <SelectItem value="__unassign__">
                  {t("unassign")}
                </SelectItem>
              )}
              {teams.map((team) => {
                const isCurrent = team.id === currentTeamId;
                const isFull = team.playerCount >= 4;
                const disabled = isCurrent || isFull;
                return (
                  <SelectItem key={team.id} value={team.id} disabled={disabled}>
                    {team.code}{team.name ? ` — ${team.name}` : ""} ({team.playerCount}/4)
                    {isCurrent ? " ✓" : ""}
                    {isFull && !isCurrent ? ` (${t("full")})` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMoving}>
            {tc("cancel")}
          </AlertDialogCancel>
          <Button onClick={handleMove} disabled={!selectedTeamId || isMoving}>
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tc("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
