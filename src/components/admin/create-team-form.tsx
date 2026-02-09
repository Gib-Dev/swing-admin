"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateTeamFormProps {
  tournamentId: string;
  onCreate: (tournamentId: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function CreateTeamForm({ tournamentId, onCreate, onCancel }: CreateTeamFormProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onCreate(tournamentId, name.trim() || undefined);
      if (result.success) {
        toast.success(t("teamCreated"));
        setName("");
        onCancel();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <label className="text-sm font-medium">{t("optionalName")}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("optionalNameHint")}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {tc("create")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
        {tc("cancel")}
      </Button>
    </form>
  );
}
