import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationTrendChart } from "@/components/admin/reservation-trend-chart";
import { copy } from "@/lib/admin/copy";
import { listBusinessDates, listNeedsReview, listReservations, todaysBusinessDate } from "@/lib/admin/mock-store";

export default async function DashboardPage() {
  const today = todaysBusinessDate();
  const todaysReservations = listReservations({ from: today, to: today }).filter((r) => r.status === "confirmed");
  const needsReview = listNeedsReview();

  const businessDates = listBusinessDates();
  const upcomingReservations = listReservations({
    from: businessDates[0] ?? today,
    to: businessDates[businessDates.length - 1] ?? today,
  }).filter((r) => r.status === "confirmed");
  const trendData = businessDates.map((date) => ({
    date,
    count: upcomingReservations.filter((r) => r.businessDate === date).length,
  }));
  const trendTotal = trendData.reduce((sum, d) => sum + d.count, 0);
  const trendAverage = (trendTotal / (trendData.length || 1)).toFixed(1);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.dashboard.title}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.dashboard.todayReservations}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{todaysReservations.length}</p>
            <Button variant="outline" size="sm" render={<Link href="/reservations" />} nativeButton={false}>
              {copy.dashboard.goToCalendar}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.dashboard.needsReviewCount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{needsReview.length}</p>
            <Button variant="outline" size="sm" render={<Link href="/reservations/needs-review" />} nativeButton={false}>
              {copy.dashboard.goToNeedsReview}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Button render={<Link href="/reservations/new" />} nativeButton={false}>
        {copy.dashboard.goToManualEntry}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{copy.dashboard.trendTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ReservationTrendChart data={trendData} />
          <p className="text-sm text-muted-foreground">
            {copy.dashboard.trendTotal(trendTotal)} / {copy.dashboard.trendAverage(trendAverage)}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
