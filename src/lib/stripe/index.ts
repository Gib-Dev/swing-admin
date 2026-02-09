import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;

  const stripeSecretKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeSecretKey) {
    console.warn("Stripe not configured: STRIPE_SECRET_KEY is not set");
    return null;
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    typescript: true,
  });
  return stripeInstance;
}

export function formatAmountForStripe(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ["JPY", "KRW", "VND"];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ["JPY", "KRW", "VND"];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }
  return amount / 100;
}

export function formatCurrency(amount: number, currency: string, locale: string = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}
