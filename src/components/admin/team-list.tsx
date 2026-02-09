"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Users, Loader2, ArrowRightLeft } from "lucide-react";

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
import { TeamItem } from "./team-item";
import { CreateTeamForm } from "./create-team-form";
import { MovePlayerDialog } from "./move-player-dialog";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
}

interface Team {
  id: string;
  code: string;
  name: string | null;
  players: Player[];
}

interface UnassignedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

interface TeamListProps {
  tournamentId: string;
  teams: Team[];
  unassignedPlayers: UnassignedPlayer[];
  onCreate: (tournamentId: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateName: (teamId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  onMovePlayer: (playerId: string, targetTeamId: string | null, tournamentId: string) => Promise<{ success: boolean; error?: string }>;
}

export function TeamList({
  tournamentId,
  teams,
  unassignedPlayers,
  onCreate,
  onUpdateName,
  onDelete,
  onMovePlayer,
}: TeamListProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Move player dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movePlayerId, setMovePlayerId] = useState("");
  const [movePlayerName, setMovePlayerName] = useState("");
  const [moveCurrentTeamId, setMoveCurrentTeamId] = useState<string | null>(null);

  const teamOptions = teams.map((team) => ({
    id: team.id,
    code: team.code,
    name: team.name,
    playerCount: team.players.length,
  }));

  async function handleDelete() {
    if (!deletingTeamId) return;
    setIsDeleting(true);

    try {
      const result = await onDelete(deletingTeamId);
      if (result.success) {
        toast.success(t("teamDeleted"));
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsDeleting(false);
      setDeletingTeamId(null);
    }
  }

  function handleOpenMoveDialog(playerId: string, playerName: string, currentTeamId: string | null) {
    setMovePlayerId(playerId);
    setMovePlayerName(playerName);
    setMoveCurrentTeamId(currentTeamId);
    setMoveDialogOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("teamsDescription")}</CardDescription>
            </div>
            {!showCreateForm && (
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createTeam")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateForm && (
            <div className="rounded-lg border p-4">
              <CreateTeamForm
                tournamentId={tournamentId}
                onCreate={onCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {teams.length === 0 && !showCreateForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("noTeams")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <TeamItem
                  key={team.id}
                  team={team}
                  onUpdateName={onUpdateName}
                  onDelete={(id) => setDeletingTeamId(id)}
                  onMovePlayer={(playerId, playerName, currentTeamId) =>
                    handleOpenMoveDialog(playerId, playerName, currentTeamId)
                  }
                />
              ))}
            </div>
          )}

          {unassignedPlayers.length > 0 && (
            <div className="mt-6 space-y-3">
              <div>
                <h4 className="text-sm font-semibold">{t("unassignedSection")}</h4>
                <p className="text-xs text-muted-foreground">{t("unassignedDescription")}</p>
              </div>
              <div className="space-y-2">
                {unassignedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
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
                        handleOpenMoveDialog(
                          player.id,
                          `${player.firstName} ${player.lastName}`,
                          null
                        )
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

          {unassignedPlayers.length === 0 && teams.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              {t("noUnassignedPlayers")}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingTeamId} onOpenChange={(open) => !open && setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTeamTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTeamConfirm")}
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

      <MovePlayerDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        playerName={movePlayerName}
        currentTeamId={moveCurrentTeamId}
        teams={teamOptions}
        tournamentId={tournamentId}
        playerId={movePlayerId}
        onMove={onMovePlayer}
      />
    </>
  );
}
