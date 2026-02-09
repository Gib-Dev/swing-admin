"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StepIndicator } from "./step-indicator";
import { TierSelectionStep } from "./tier-selection-step";
import { SponsorPlayerStep } from "./sponsor-player-step";
import {
  sponsorRegistrationSchema,
  type SponsorRegistrationInput,
} from "@/lib/validations/registration";
import { createSponsorRegistration } from "@/lib/actions/registration";

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

interface SponsorRegistrationFormProps {
  tournament: {
    id: string;
    name: string;
    currency: string;
  };
  tiers: Tier[];
  locale: string;
}

export function SponsorRegistrationForm({
  tournament,
  tiers,
  locale,
}: SponsorRegistrationFormProps) {
  const t = useTranslations("registration");
  const tPlayer = useTranslations("player");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SponsorRegistrationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(sponsorRegistrationSchema) as any,
    defaultValues: {
      tournamentId: tournament.id,
      selectedTiers: [],
      company: {
        companyName: "",
        contactName: "",
        contactTitle: "",
        contactEmail: "",
        contactPhone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Canada",
      },
      players: [],
    },
  });

  const selectedTierIds = form.watch("selectedTiers");

  // Calculate total player spots from selected tiers
  const totalPlayerSpots = tiers
    .filter((tier) => selectedTierIds.includes(tier.id))
    .reduce((sum, tier) => sum + tier.playerSpotsIncluded, 0);

  const hasPlayerSpots = totalPlayerSpots > 0;

  // Build step list dynamically (skip player step if 0 spots)
  const stepLabels = hasPlayerSpots
    ? [t("companyInfo"), t("selectTiers"), t("playerInfo"), t("summary")]
    : [t("companyInfo"), t("selectTiers"), t("summary")];

  // Adjust player forms array when totalPlayerSpots changes
  useEffect(() => {
    const currentPlayers = form.getValues("players") ?? [];
    if (totalPlayerSpots > currentPlayers.length) {
      const newPlayers = [...currentPlayers];
      for (let i = currentPlayers.length; i < totalPlayerSpots; i++) {
        newPlayers.push({
          title: "mr",
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          addressLine1: "",
          city: "",
          province: "",
          postalCode: "",
          country: "Canada",
        });
      }
      form.setValue("players", newPlayers);
    } else if (totalPlayerSpots < currentPlayers.length) {
      form.setValue("players", currentPlayers.slice(0, totalPlayerSpots));
    }
  }, [totalPlayerSpots, form]);

  function handleToggleTier(tierId: string) {
    const current = form.getValues("selectedTiers");
    if (current.includes(tierId)) {
      form.setValue(
        "selectedTiers",
        current.filter((id) => id !== tierId),
        { shouldValidate: true }
      );
    } else {
      form.setValue("selectedTiers", [...current, tierId], {
        shouldValidate: true,
      });
    }
  }

  // Map display step to "logical step" considering optional player step
  function getLogicalStep(displayStep: number): "company" | "tiers" | "players" | "summary" {
    if (displayStep === 1) return "company";
    if (displayStep === 2) return "tiers";
    if (hasPlayerSpots) {
      if (displayStep === 3) return "players";
      return "summary";
    }
    return "summary";
  }

  const totalSteps = hasPlayerSpots ? 4 : 3;

  async function validateCurrentStep(): Promise<boolean> {
    const logical = getLogicalStep(step);
    if (logical === "company") {
      return form.trigger("company");
    }
    if (logical === "tiers") {
      return form.trigger("selectedTiers");
    }
    if (logical === "players") {
      return form.trigger("players");
    }
    return true;
  }

  async function goNext() {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(data: SponsorRegistrationInput) {
    setIsSubmitting(true);
    try {
      const result = await createSponsorRegistration({
        ...data,
        locale,
      });
      if (result.success) {
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          router.push(`/register/success?type=sponsor`);
        }
      } else {
        toast.error(result.error ?? tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const logicalStep = getLogicalStep(step);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: tournament.currency,
    }).format(amount);
  };

  const totalAmount = tiers
    .filter((tier) => selectedTierIds.includes(tier.id))
    .reduce((sum, tier) => sum + parseFloat(tier.price), 0);

  return (
    <div>
      <StepIndicator steps={stepLabels} currentStep={step} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Step: Company Info */}
          {logicalStep === "company" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("companyInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="company.companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companyName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company.contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contactName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company.contactTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contactTitle")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company.contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company.contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("phone")}</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company.addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tPlayer("address")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company.addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tPlayer("address")} 2</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="company.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("city")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company.province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("province")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("postalCode")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="button" onClick={goNext}>
                  {tCommon("next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step: Tier Selection */}
          {logicalStep === "tiers" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("selectTiers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TierSelectionStep
                  tiers={tiers}
                  selectedTierIds={selectedTierIds}
                  onToggleTier={handleToggleTier}
                  currency={tournament.currency}
                  locale={locale}
                />
                {form.formState.errors.selectedTiers && (
                  <p className="mt-2 text-sm text-destructive">
                    {form.formState.errors.selectedTiers.message}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tCommon("back")}
                </Button>
                <Button type="button" onClick={goNext}>
                  {tCommon("next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step: Player Info (conditional) */}
          {logicalStep === "players" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("playerInfo")} ({totalPlayerSpots})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SponsorPlayerStep
                  form={form}
                  totalPlayerSpots={totalPlayerSpots}
                />
              </CardContent>
              <CardFooter className="justify-between">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tCommon("back")}
                </Button>
                <Button type="button" onClick={goNext}>
                  {tCommon("next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step: Summary */}
          {logicalStep === "summary" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company info summary */}
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">{t("companyInfo")}</h3>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">{t("companyName")}</dt>
                      <dd className="font-medium">
                        {form.getValues("company.companyName")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("contactName")}</dt>
                      <dd className="font-medium">
                        {form.getValues("company.contactName")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("email")}</dt>
                      <dd className="font-medium">
                        {form.getValues("company.contactEmail")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("phone")}</dt>
                      <dd className="font-medium">
                        {form.getValues("company.contactPhone")}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Tiers summary */}
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">{t("selectTiers")}</h3>
                  <div className="space-y-2">
                    {tiers
                      .filter((tier) => selectedTierIds.includes(tier.id))
                      .map((tier) => (
                        <div
                          key={tier.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{tier.name}</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(tier.price))}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Players summary */}
                {totalPlayerSpots > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-semibold">
                      {t("playerInfo")} ({totalPlayerSpots})
                    </h3>
                    <div className="space-y-1 text-sm">
                      {(form.getValues("players") ?? []).map((player, i) => (
                        <p key={i}>
                          {player.firstName} {player.lastName} — {player.email}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {t("totalAmount")}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tCommon("back")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("proceedToPayment")}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
