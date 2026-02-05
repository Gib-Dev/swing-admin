import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  primaryKey,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "super_admin"]);
export const registrationTypeEnum = pgEnum("registration_type", [
  "employee",
  "sponsor",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);
export const titleEnum = pgEnum("title", ["mr", "mrs", "ms", "dr"]);

// Users (Admins)
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tournaments
export const tournaments = pgTable(
  "tournaments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    location: text("location").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    maxTeams: integer("max_teams").notNull().default(125),
    employeeRegistrationPrice: decimal("employee_registration_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    currency: text("currency").notNull().default("CAD"),
    registrationOpen: boolean("registration_open").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("tournament_registration_open_idx").on(table.registrationOpen)]
);

// Sponsorship Tiers
export const sponsorshipTiers = pgTable(
  "sponsorship_tiers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    playerSpotsIncluded: integer("player_spots_included").notNull().default(0),
    teamSpotsIncluded: integer("team_spots_included").notNull().default(0),
    maxQuota: integer("max_quota"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sponsorship_tier_tournament_idx").on(table.tournamentId)]
);

// Teams
export const teams = pgTable(
  "teams",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    name: text("name"),
    createdByRegistrationId: text("created_by_registration_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_tournament_idx").on(table.tournamentId),
    index("team_code_idx").on(table.code),
  ]
);

// Players
export const players = pgTable(
  "players",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
    title: titleEnum("title").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    birthDate: timestamp("birth_date", { withTimezone: true }),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    province: text("province").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("Canada"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("player_registration_idx").on(table.registrationId),
    index("player_team_idx").on(table.teamId),
    index("player_email_idx").on(table.email),
  ]
);

// Registrations
export const registrations = pgTable(
  "registrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    type: registrationTypeEnum("type").notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("CAD"),
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("registration_tournament_idx").on(table.tournamentId)]
);

// Sponsorships (link between registration and sponsorship tiers)
export const sponsorships = pgTable(
  "sponsorships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    sponsorshipTierId: text("sponsorship_tier_id")
      .notNull()
      .references(() => sponsorshipTiers.id, { onDelete: "restrict" }),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    contactTitle: text("contact_title"),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    province: text("province").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("Canada"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sponsorship_registration_idx").on(table.registrationId),
    index("sponsorship_tier_idx").on(table.sponsorshipTierId),
  ]
);

// Payments
export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    registrationId: text("registration_id")
      .notNull()
      .unique()
      .references(() => registrations.id, { onDelete: "cascade" }),
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("CAD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_registration_idx").on(table.registrationId),
    index("payment_stripe_session_idx").on(table.stripeSessionId),
    index("payment_status_idx").on(table.status),
  ]
);

// NextAuth.js tables (required for Drizzle adapter)
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("account_user_idx").on(table.userId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [index("session_user_idx").on(table.userId)]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  teams: many(teams),
  sponsorshipTiers: many(sponsorshipTiers),
  registrations: many(registrations),
}));

export const sponsorshipTiersRelations = relations(
  sponsorshipTiers,
  ({ one, many }) => ({
    tournament: one(tournaments, {
      fields: [sponsorshipTiers.tournamentId],
      references: [tournaments.id],
    }),
    sponsorships: many(sponsorships),
  })
);

export const teamsRelations = relations(teams, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [teams.tournamentId],
    references: [tournaments.id],
  }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  registration: one(registrations, {
    fields: [players.registrationId],
    references: [registrations.id],
  }),
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
}));

export const registrationsRelations = relations(
  registrations,
  ({ one, many }) => ({
    tournament: one(tournaments, {
      fields: [registrations.tournamentId],
      references: [tournaments.id],
    }),
    players: many(players),
    sponsorships: many(sponsorships),
    payment: one(payments),
  })
);

export const sponsorshipsRelations = relations(sponsorships, ({ one }) => ({
  registration: one(registrations, {
    fields: [sponsorships.registrationId],
    references: [registrations.id],
  }),
  sponsorshipTier: one(sponsorshipTiers, {
    fields: [sponsorships.sponsorshipTierId],
    references: [sponsorshipTiers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.registrationId],
    references: [registrations.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
