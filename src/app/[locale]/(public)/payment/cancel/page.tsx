import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PaymentCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("payment");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">{t("cancelled")}</h1>
          <p className="mb-6 text-muted-foreground">
            {t("cancelledMessage")}
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">{t("returnHome")}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t("tryAgain")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
