"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepIndicator } from "./step-indicator";
import {
  employeeRegistrationSchema,
  type EmployeeRegistrationInput,
} from "@/lib/validations/registration";
import { createEmployeeRegistration } from "@/lib/actions/registration";
import { validateTeamCode } from "@/lib/actions/team";

interface EmployeeRegistrationFormProps {
  tournament: {
    id: string;
    name: string;
    price: string;
    currency: string;
  };
  locale: string;
}

export function EmployeeRegistrationForm({
  tournament,
  locale,
}: EmployeeRegistrationFormProps) {
  const t = useTranslations("registration");
  const tPlayer = useTranslations("player");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamCodeValid, setTeamCodeValid] = useState<boolean | null>(null);
  const [teamCodeError, setTeamCodeError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const form = useForm<EmployeeRegistrationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(employeeRegistrationSchema) as any,
    defaultValues: {
      tournamentId: tournament.id,
      player: {
        title: "mr",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Canada",
      },
      teamOption: {
        type: "create",
        teamName: "",
      },
    },
  });

  const steps = [t("personalInfo"), t("teamOption"), t("summary")];

  const teamOptionType = form.watch("teamOption.type");

  async function handleValidateTeamCode() {
    const code = form.getValues("teamOption.teamCode" as "teamOption.type");
    if (!code || typeof code !== "string" || code.length !== 6) {
      setTeamCodeError(t("teamCodeInvalid"));
      setTeamCodeValid(false);
      return;
    }

    setIsValidatingCode(true);
    setTeamCodeError(null);

    try {
      const result = await validateTeamCode(tournament.id, code);
      if (result.valid) {
        setTeamCodeValid(true);
        setTeamCodeError(null);
      } else {
        setTeamCodeValid(false);
        setTeamCodeError(result.error ?? t("teamNotFound"));
      }
    } catch {
      setTeamCodeError(t("teamNotFound"));
      setTeamCodeValid(false);
    } finally {
      setIsValidatingCode(false);
    }
  }

  async function validateStep(nextStep: number) {
    if (step === 1) {
      const valid = await form.trigger("player");
      if (!valid) return false;
    }
    if (step === 2) {
      if (teamOptionType === "join") {
        const valid = await form.trigger("teamOption");
        if (!valid) return false;
        if (!teamCodeValid) {
          setTeamCodeError(t("teamCodeValidateFirst"));
          return false;
        }
      }
    }
    return true;
  }

  async function goToStep(nextStep: number) {
    if (nextStep > step) {
      const valid = await validateStep(nextStep);
      if (!valid) return;
    }
    setStep(nextStep);
  }

  async function handleSubmit(data: EmployeeRegistrationInput) {
    setIsSubmitting(true);
    try {
      const result = await createEmployeeRegistration({
        ...data,
        locale,
      });
      if (result.success) {
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          router.push(`/register/success?type=employee`);
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: tournament.currency,
    }).format(parseFloat(amount));
  };

  return (
    <div>
      <StepIndicator steps={steps} currentStep={step} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("personalInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="player.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tPlayer("selectTitle")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mr">{tPlayer("titles.mr")}</SelectItem>
                          <SelectItem value="mrs">{tPlayer("titles.mrs")}</SelectItem>
                          <SelectItem value="ms">{tPlayer("titles.ms")}</SelectItem>
                          <SelectItem value="dr">{tPlayer("titles.dr")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="player.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("firstName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPlayer("lastName")}</FormLabel>
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
                    name="player.email"
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
                    name="player.phone"
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
                  name="player.addressLine1"
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
                  name="player.addressLine2"
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
                    name="player.city"
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
                    name="player.province"
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
                    name="player.postalCode"
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
                <Button type="button" onClick={() => goToStep(2)}>
                  {tCommon("next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Team Option */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("teamOption")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={teamOptionType === "create"}
                      onChange={() => {
                        form.setValue("teamOption", {
                          type: "create",
                          teamName: "",
                        });
                        setTeamCodeValid(null);
                        setTeamCodeError(null);
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{t("createTeam")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("createTeamDescription")}
                      </p>
                      {teamOptionType === "create" && (
                        <div className="mt-3">
                          <FormField
                            control={form.control}
                            name="teamOption.teamName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("teamName")}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t("teamNamePlaceholder")}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={teamOptionType === "join"}
                      onChange={() => {
                        form.setValue("teamOption", {
                          type: "join",
                          teamCode: "",
                        });
                        setTeamCodeValid(null);
                        setTeamCodeError(null);
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{t("joinTeam")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("joinTeamDescription")}
                      </p>
                      {teamOptionType === "join" && (
                        <div className="mt-3">
                          <FormField
                            control={form.control}
                            name="teamOption.teamCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("teamCode")}</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input
                                      placeholder={t("teamCodePlaceholder")}
                                      maxLength={6}
                                      className="uppercase"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(
                                          e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, "")
                                        );
                                        setTeamCodeValid(null);
                                        setTeamCodeError(null);
                                      }}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleValidateTeamCode}
                                    disabled={isValidatingCode}
                                  >
                                    {isValidatingCode ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      t("validateCode")
                                    )}
                                  </Button>
                                </div>
                                {teamCodeValid === true && (
                                  <p className="text-sm text-green-600">
                                    {t("teamCodeValid")}
                                  </p>
                                )}
                                {teamCodeError && (
                                  <p className="text-sm text-destructive">
                                    {teamCodeError}
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tCommon("back")}
                </Button>
                <Button type="button" onClick={() => goToStep(3)}>
                  {tCommon("next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">{t("personalInfo")}</h3>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("firstName")}</dt>
                      <dd className="font-medium">
                        {form.getValues("player.firstName")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("lastName")}</dt>
                      <dd className="font-medium">
                        {form.getValues("player.lastName")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("email")}</dt>
                      <dd className="font-medium">
                        {form.getValues("player.email")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{tPlayer("phone")}</dt>
                      <dd className="font-medium">
                        {form.getValues("player.phone")}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">{tPlayer("address")}</dt>
                      <dd className="font-medium">
                        {form.getValues("player.addressLine1")}
                        {form.getValues("player.addressLine2") &&
                          `, ${form.getValues("player.addressLine2")}`}
                        , {form.getValues("player.city")},{" "}
                        {form.getValues("player.province")}{" "}
                        {form.getValues("player.postalCode")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">{t("teamOption")}</h3>
                  <p className="text-sm">
                    {teamOptionType === "create" ? (
                      <>
                        {t("createTeam")}
                        {form.getValues("teamOption.teamName") && (
                          <span className="ml-1 font-medium">
                            — {form.getValues("teamOption.teamName" as "teamOption.type")}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {t("joinTeam")}
                        <span className="ml-1 font-mono font-medium">
                          {form.getValues("teamOption.teamCode" as "teamOption.type")}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {t("totalAmount")}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(tournament.price)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
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
