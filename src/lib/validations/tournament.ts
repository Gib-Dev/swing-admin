import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z
    .string()
    .min(1, "Tournament name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(300, "Location must be less than 300 characters"),
  startDate: z.coerce.date({ message: "Start date is required" }),
  endDate: z.coerce.date({ message: "End date is required" }),
  maxTeams: z
    .number()
    .int()
    .min(1, "Must have at least 1 team")
    .max(500, "Maximum 500 teams"),
  employeeRegistrationPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = createTournamentSchema.partial().extend({
  registrationOpen: z.boolean().optional(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
