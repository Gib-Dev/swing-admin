import { Resend } from "resend";
import { getRegistrationConfirmationEmail } from "./templates";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("Resend not configured: RESEND_API_KEY is not set");
    return null;
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email logged to console] To: ${to} | Subject: ${subject}`);
    console.log(html);
    return;
  }

  const fromAddress = process.env["RESEND_FROM_EMAIL"] || "noreply@example.com";

  await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
  });
}

interface SendRegistrationConfirmationParams {
  to: string;
  type: "employee" | "sponsor";
  tournamentName: string;
  locale: string;
}

export async function sendRegistrationConfirmationEmail({
  to,
  type,
  tournamentName,
  locale,
}: SendRegistrationConfirmationParams) {
  const { subject, html } = getRegistrationConfirmationEmail({
    type,
    tournamentName,
    locale,
  });

  await sendEmail({ to, subject, html });
}
