"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Plan } from "@/lib/booking/mock-data";

export function PlanSelector({
  plans,
  businessDate,
  slotId,
  currency,
}: {
  plans: Plan[];
  businessDate: string;
  slotId: string;
  currency: string;
}) {
  const router = useRouter();
  const t = useTranslations("booking.plan");
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/party?date=${businessDate}&time=${slotId}&plan=${plan.id}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              router.push(`/party?date=${businessDate}&time=${slotId}&plan=${plan.id}`);
            }
          }}
          className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between gap-2 text-base">
              <span>{plan.name}</span>
              <span className="font-mono text-sm font-normal text-muted-foreground">
                {formatter.format(plan.priceCents / 100)}
              </span>
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("partyRange", { min: plan.minPartySize, max: plan.maxPartySize })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
