import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency)
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* .env.local not found, rely on existing env */ }

import { getDb } from "./index";
import { users, tournaments, sponsorshipTiers } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const db = getDb();

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123!", 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@swingadmin.com",
      name: "Admin User",
      passwordHash,
      role: "super_admin",
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    console.log("Created admin user:", adminUser.email);
  } else {
    console.log("Admin user already exists");
  }

  // Create sample tournament
  const [tournament] = await db
    .insert(tournaments)
    .values({
      name: "Annual Golf Championship 2026",
      description: "Join us for our annual golf tournament featuring teams of 4 players competing for glory and prizes.",
      location: "Green Valley Golf Club, Montreal, QC",
      startDate: new Date("2026-06-15"),
      endDate: new Date("2026-06-17"),
      maxTeams: 125,
      employeeRegistrationPrice: "150.00",
      currency: "CAD",
      registrationOpen: true,
    })
    .onConflictDoNothing()
    .returning();

  if (tournament) {
    console.log("Created tournament:", tournament.name);

    // Create sponsorship tiers
    const tiers = await db
      .insert(sponsorshipTiers)
      .values([
        {
          tournamentId: tournament.id,
          name: "Bronze",
          description: "Logo on website + 2 individual player spots",
          price: "1000.00",
          playerSpotsIncluded: 2,
          teamSpotsIncluded: 0,
          maxQuota: 20,
          sortOrder: 0,
        },
        {
          tournamentId: tournament.id,
          name: "Silver",
          description: "Logo on website + banner at event + 1 full team (4 players)",
          price: "2000.00",
          playerSpotsIncluded: 0,
          teamSpotsIncluded: 1,
          maxQuota: 15,
          sortOrder: 1,
        },
        {
          tournamentId: tournament.id,
          name: "Gold",
          description: "Premium logo placement + banner + 1 full team + mention in announcements",
          price: "3000.00",
          playerSpotsIncluded: 0,
          teamSpotsIncluded: 1,
          maxQuota: 10,
          sortOrder: 2,
        },
        {
          tournamentId: tournament.id,
          name: "Platinum",
          description: "Title sponsor benefits + 2 full teams (8 players) + VIP experience",
          price: "5000.00",
          playerSpotsIncluded: 0,
          teamSpotsIncluded: 2,
          maxQuota: 5,
          sortOrder: 3,
        },
      ])
      .returning();

    console.log(`Created ${tiers.length} sponsorship tiers`);
  } else {
    console.log("Tournament already exists");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
