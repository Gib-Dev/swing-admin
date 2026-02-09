import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { payments, registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendRegistrationConfirmationEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.["registrationId"];

      if (!registrationId) {
        console.error("No registrationId in session metadata");
        break;
      }

      // Update payment status
      await db
        .update(payments)
        .set({
          status: "completed",
          paidAt: new Date(),
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        })
        .where(eq(payments.registrationId, registrationId));

      // Send confirmation email
      const registration = await db.query.registrations.findFirst({
        where: eq(registrations.id, registrationId),
        with: {
          tournament: true,
          players: true,
          sponsorships: true,
        },
      });

      if (registration) {
        const emailTo =
          registration.type === "employee"
            ? registration.players[0]?.email
            : registration.sponsorships[0]?.contactEmail;

        if (emailTo) {
          await sendRegistrationConfirmationEmail({
            to: emailTo,
            type: registration.type,
            tournamentName: registration.tournament.name,
            locale: registration.locale,
          });
        }
      }

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.["registrationId"];

      if (registrationId) {
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.registrationId, registrationId));
      }

      break;
    }

    default:
      // Unhandled event type — return 200 to acknowledge
      break;
  }

  return NextResponse.json({ received: true });
}
