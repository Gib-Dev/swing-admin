import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function RegistrationSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("registration");
  const tPayment = await getTranslations("payment");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">{t("success")}</h1>
          <p className="mb-6 text-muted-foreground">{t("successMessage")}</p>
          <p className="mb-6 text-sm text-muted-foreground">
            {t("paymentPending")}
          </p>
          <Button asChild>
            <Link href="/">{tPayment("returnHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
