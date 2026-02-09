import { getStripe, formatAmountForStripe } from "./index";
import { getDb } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface CreateCheckoutSessionParams {
  registrationId: string;
  amount: number;
  currency: string;
  tournamentName: string;
  type: "employee" | "sponsor";
  locale: string;
}

export async function createCheckoutSession({
  registrationId,
  amount,
  currency,
  tournamentName,
  type,
  locale,
}: CreateCheckoutSessionParams): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    console.log("Stripe not configured — skipping checkout session creation");
    return null;
  }

  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";
  const localePrefix = locale === "fr" ? "/fr" : "/en";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: formatAmountForStripe(amount, currency),
          product_data: {
            name: `${tournamentName} — ${type === "employee" ? "Employee" : "Sponsor"} Registration`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      registrationId,
      type,
    },
    success_url: `${baseUrl}${localePrefix}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${localePrefix}/payment/cancel?registration_id=${registrationId}`,
  });

  // Store the stripe session ID on the payment record
  const db = getDb();
  await db
    .update(payments)
    .set({ stripeSessionId: session.id })
    .where(eq(payments.registrationId, registrationId));

  return session.url ? { url: session.url } : null;
}
