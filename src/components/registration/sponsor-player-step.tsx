"use client";

import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
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
import { cn } from "@/lib/utils";
import type { SponsorRegistrationInput } from "@/lib/validations/registration";

interface SponsorPlayerStepProps {
  form: UseFormReturn<SponsorRegistrationInput>;
  totalPlayerSpots: number;
}

export function SponsorPlayerStep({
  form,
  totalPlayerSpots,
}: SponsorPlayerStepProps) {
  const tPlayer = useTranslations("player");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {Array.from({ length: totalPlayerSpots }).map((_, index) => (
        <PlayerAccordion
          key={index}
          index={index}
          form={form}
          isExpanded={expandedIndex === index}
          onToggle={() =>
            setExpandedIndex(expandedIndex === index ? null : index)
          }
          tPlayer={tPlayer}
        />
      ))}
    </div>
  );
}

function PlayerAccordion({
  index,
  form,
  isExpanded,
  onToggle,
  tPlayer,
}: {
  index: number;
  form: UseFormReturn<SponsorRegistrationInput>;
  isExpanded: boolean;
  onToggle: () => void;
  tPlayer: ReturnType<typeof useTranslations>;
}) {
  const firstName = form.watch(`players.${index}.firstName`);
  const lastName = form.watch(`players.${index}.lastName`);
  const label =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : `${tPlayer("title")} ${index + 1}`;

  return (
    <div className="rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="font-medium">{label}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all",
          isExpanded ? "max-h-[2000px] px-4 pb-4" : "max-h-0"
        )}
      >
        <div className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name={`players.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tPlayer("selectTitle")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? "mr"}
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
              name={`players.${index}.firstName`}
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
              name={`players.${index}.lastName`}
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
              name={`players.${index}.email`}
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
              name={`players.${index}.phone`}
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
            name={`players.${index}.addressLine1`}
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
            name={`players.${index}.addressLine2`}
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
              name={`players.${index}.city`}
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
              name={`players.${index}.province`}
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
              name={`players.${index}.postalCode`}
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
        </div>
      </div>
    </div>
  );
}
