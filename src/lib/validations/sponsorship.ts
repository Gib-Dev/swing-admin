import { z } from "zod";

export const createSponsorshipTierSchema = z.object({
  tournamentId: z.string().uuid("Invalid tournament ID"),
  name: z
    .string()
    .min(1, "Tier name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  playerSpotsIncluded: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(20, "Maximum 20 player spots"),
  teamSpotsIncluded: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(5, "Maximum 5 team spots"),
  maxQuota: z
    .number()
    .int()
    .min(1, "Must be at least 1")
    .max(100, "Maximum quota is 100")
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateSponsorshipTierInput = z.infer<typeof createSponsorshipTierSchema>;

export const updateSponsorshipTierSchema = createSponsorshipTierSchema
  .omit({ tournamentId: true })
  .partial();

export type UpdateSponsorshipTierInput = z.infer<typeof updateSponsorshipTierSchema>;
