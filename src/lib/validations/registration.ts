import { z } from "zod";

const titleEnum = z.enum(["mr", "mrs", "ms", "dr"]);

const playerInfoSchema = z.object({
  title: titleEnum,
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\d\s\-+()]+$/, "Invalid phone number"),
  birthDate: z.coerce.date().optional(),
  addressLine1: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be less than 200 characters"),
  addressLine2: z.string().max(200).optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  province: z
    .string()
    .min(1, "Province/State is required")
    .max(100, "Province must be less than 100 characters"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be less than 20 characters"),
  country: z.string().default("Canada"),
});

export type PlayerInfo = z.infer<typeof playerInfoSchema>;

export const employeeRegistrationSchema = z.object({
  tournamentId: z.string().uuid("Invalid tournament ID"),
  player: playerInfoSchema,
  teamOption: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("create"),
      teamName: z.string().max(100).optional(),
    }),
    z.object({
      type: z.literal("join"),
      teamCode: z
        .string()
        .length(6, "Team code must be 6 characters")
        .regex(/^[A-Z0-9]+$/, "Team code must be uppercase alphanumeric"),
    }),
  ]),
});

export type EmployeeRegistrationInput = z.infer<typeof employeeRegistrationSchema>;

const companyInfoSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters"),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(100, "Contact name must be less than 100 characters"),
  contactTitle: z.string().max(100).optional(),
  contactEmail: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  contactPhone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\d\s\-+()]+$/, "Invalid phone number"),
  addressLine1: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be less than 200 characters"),
  addressLine2: z.string().max(200).optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  province: z
    .string()
    .min(1, "Province/State is required")
    .max(100, "Province must be less than 100 characters"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be less than 20 characters"),
  country: z.string().default("Canada"),
});

export type CompanyInfo = z.infer<typeof companyInfoSchema>;

export const sponsorRegistrationSchema = z.object({
  tournamentId: z.string().uuid("Invalid tournament ID"),
  selectedTiers: z
    .array(z.string().uuid("Invalid tier ID"))
    .min(1, "Select at least one sponsorship tier"),
  company: companyInfoSchema,
  players: z.array(playerInfoSchema).optional(),
});

export type SponsorRegistrationInput = z.infer<typeof sponsorRegistrationSchema>;

export const teamCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Team code must be 6 characters")
    .regex(/^[A-Z0-9]+$/, "Team code must be uppercase alphanumeric"),
});

export type TeamCodeInput = z.infer<typeof teamCodeSchema>;
