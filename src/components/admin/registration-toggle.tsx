"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RegistrationToggleProps {
  tournamentId: string;
  isOpen: boolean;
  onToggle: (id: string) => Promise<{ success: boolean; error?: string; isOpen?: boolean }>;
}

export function RegistrationToggle({
  tournamentId,
  isOpen: initialIsOpen,
  onToggle,
}: RegistrationToggleProps) {
  const t = useTranslations("tournament");
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);

    try {
      const result = await onToggle(tournamentId);

      if (result.success) {
        setIsOpen(result.isOpen ?? !isOpen);
        toast.success(
          result.isOpen ? "Registration opened" : "Registration closed"
        );
      } else {
        toast.error(result.error ?? "Failed to update registration status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              isOpen ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <div>
            <p className="font-medium">{t("registrationOpen")}</p>
            <p className="text-sm text-muted-foreground">
              {isOpen
                ? "Players can register for this tournament"
                : "Registration is currently closed"}
            </p>
          </div>
        </div>
        <Button
          variant={isOpen ? "destructive" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isOpen ? t("closeRegistration") : t("openRegistration")}
        </Button>
      </CardContent>
    </Card>
  );
}
