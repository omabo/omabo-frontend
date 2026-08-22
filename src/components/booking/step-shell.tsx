import Link from "next/link";
import { getTranslations } from "next-intl/server";

const STEPS = ["date", "plan", "party", "guest-info", "payment"] as const;
export type BookingStep = (typeof STEPS)[number];

export async function StepProgress({ current }: { current: BookingStep }) {
  const t = await getTranslations("booking.common");
  const currentIndex = STEPS.indexOf(current);
  return (
    <ol className="flex items-center gap-1.5" aria-label={t("progress")}>
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={step === current ? "step" : undefined}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            index <= currentIndex ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </ol>
  );
}

export function BookingHeader({ restaurantName }: { restaurantName: string }) {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-heading text-lg font-semibold text-foreground">
          {restaurantName}
        </Link>
      </div>
    </header>
  );
}

export async function StepShell({
  step,
  backHref,
  children,
}: {
  step: BookingStep;
  backHref?: string;
  restaurantName?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("booking.common");
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t("back")}
          >
            ←
          </Link>
        ) : null}
        <div className="flex-1">
          <StepProgress current={step} />
        </div>
      </div>
      {children}
    </main>
  );
}
