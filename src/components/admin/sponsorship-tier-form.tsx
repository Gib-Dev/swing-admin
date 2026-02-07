"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createSponsorshipTierSchema,
  type CreateSponsorshipTierInput,
} from "@/lib/validations/sponsorship";

interface SponsorshipTierFormProps {
  tournamentId: string;
  initialData?: Partial<CreateSponsorshipTierInput> & { id?: string };
  onSubmit: (data: CreateSponsorshipTierInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function SponsorshipTierForm({
  tournamentId,
  initialData,
  onSubmit,
  onCancel,
}: SponsorshipTierFormProps) {
  const t = useTranslations("sponsorship");
  const tc = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateSponsorshipTierInput>({
    resolver: zodResolver(createSponsorshipTierSchema),
    defaultValues: {
      tournamentId,
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? "0.00",
      playerSpotsIncluded: initialData?.playerSpotsIncluded ?? 0,
      teamSpotsIncluded: initialData?.teamSpotsIncluded ?? 0,
      maxQuota: initialData?.maxQuota ?? null,
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });

  async function handleSubmit(data: CreateSponsorshipTierInput) {
    setIsLoading(true);

    try {
      const result = await onSubmit(data);

      if (result.success) {
        toast.success(initialData?.id ? t("tierUpdated") : t("tierCreated"));
        onCancel();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tierName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Gold, Silver, Bronze..."
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tierDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Benefits included in this tier..."
                  disabled={isLoading}
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("price")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="5000.00"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxQuota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maxQuota")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="Unlimited"
                    disabled={isLoading}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : parseInt(val) || null);
                    }}
                  />
                </FormControl>
                <FormDescription>{t("maxQuotaHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="playerSpotsIncluded"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("playerSpots")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teamSpotsIncluded"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("teamSpots")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sortOrder")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>{t("sortOrderHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? tc("save") : tc("create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onCancel}
          >
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
