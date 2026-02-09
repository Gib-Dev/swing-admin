interface RegistrationConfirmationParams {
  type: "employee" | "sponsor";
  tournamentName: string;
  locale: string;
}

export function getRegistrationConfirmationEmail({
  type,
  tournamentName,
  locale,
}: RegistrationConfirmationParams): { subject: string; html: string } {
  if (locale === "fr") {
    return getFrenchTemplate(type, tournamentName);
  }
  return getEnglishTemplate(type, tournamentName);
}

function getEnglishTemplate(
  type: "employee" | "sponsor",
  tournamentName: string
): { subject: string; html: string } {
  const typeLabel = type === "employee" ? "Employee" : "Sponsor";
  return {
    subject: `Registration Confirmed — ${tournamentName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Registration Confirmed</h1>
  <p>Thank you for your ${typeLabel.toLowerCase()} registration for <strong>${escapeHtml(tournamentName)}</strong>.</p>
  <p>Your payment has been received and your registration is confirmed.</p>
  <p>You will receive additional information about the tournament closer to the event date.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
</body>
</html>`,
  };
}

function getFrenchTemplate(
  type: "employee" | "sponsor",
  tournamentName: string
): { subject: string; html: string } {
  const typeLabel = type === "employee" ? "employé" : "commanditaire";
  return {
    subject: `Inscription confirmée — ${tournamentName}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Inscription confirmée</h1>
  <p>Merci pour votre inscription ${typeLabel} au tournoi <strong>${escapeHtml(tournamentName)}</strong>.</p>
  <p>Votre paiement a été reçu et votre inscription est confirmée.</p>
  <p>Vous recevrez des informations supplémentaires sur le tournoi à l'approche de la date de l'événement.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #6b7280; font-size: 14px;">Ceci est un message automatique. Veuillez ne pas répondre à ce courriel.</p>
</body>
</html>`,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
