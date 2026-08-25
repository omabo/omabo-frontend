import { NeedsReviewList } from "@/components/admin/needs-review-list";
import { copy } from "@/lib/admin/copy";
import { listNeedsReview } from "@/lib/admin/mock-store";

export default async function NeedsReviewPage() {
  const reservations = listNeedsReview();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.needsReview.title}</h1>
      <NeedsReviewList reservations={reservations} />
    </main>
  );
}
