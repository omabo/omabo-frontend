import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { formatBusinessDate } from "@/lib/datetime";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; date?: string; time?: string; plan?: string; party?: string; status?: string }>;
}) {
  const t = await getTranslations("booking.confirmation");
  const { code, date, time, plan, party, status } = await searchParams;

  if (!code || !date) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">{t("missingDetails")}</p>
        <Button className="mt-4" render={<Link href="/date" />} nativeButton={false}>
          {t("startOver")}
        </Button>
      </main>
    );
  }

  const needsReview = status === "needs_review";

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
      {needsReview ? (
        <Clock className="size-12 text-primary" />
      ) : (
        <CheckCircle2 className="size-12 text-primary" />
      )}

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          {needsReview ? t("reviewHeading") : t("confirmedHeading")}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {needsReview ? t("reviewBody") : t("confirmedBody")}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-1 rounded-lg border border-border bg-card px-5 py-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("codeLabel")}</span>
          <span className="font-mono font-medium">{code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{formatBusinessDate(date)}</span>
          <span>{time}</span>
        </div>
        {plan ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{plan}</span>
            <span>{party ? t("partyCount", { count: Number(party) }) : null}</span>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("manageHint")}{" "}
        <Link href="/r/demo-active" className="underline underline-offset-2">
          {t("manageLink")}
        </Link>
      </p>
    </main>
  );
}
