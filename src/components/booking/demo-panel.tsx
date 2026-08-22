import Link from "next/link";

/**
 * Phase 0 only: quick links into every mocked state so a reviewer can click
 * through edge cases without editing query strings or fixture data by hand.
 * Remove once the flow is backed by a real API and real reservation tokens.
 */
export function DemoPanel() {
  return (
    <div className="border-t border-dashed border-border bg-muted/30 px-4 py-6 text-xs text-muted-foreground sm:px-6">
      <div className="mx-auto max-w-2xl space-y-2">
        <p className="font-medium tracking-wide uppercase">Phase 0 demo links (not part of the real product)</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link className="underline underline-offset-2" href="/?tenant=closed-demo">
            Booking closed
          </Link>
          <Link className="underline underline-offset-2" href="/?tenant=paused-demo">
            Restaurant paused
          </Link>
          <Link className="underline underline-offset-2" href="/r/demo-active">
            Manage: active
          </Link>
          <Link className="underline underline-offset-2" href="/r/demo-cancelled">
            Manage: cancelled
          </Link>
          <Link className="underline underline-offset-2" href="/r/demo-superseded">
            Manage: superseded
          </Link>
          <Link className="underline underline-offset-2" href="/r/demo-deadline-passed">
            Manage: past deadline
          </Link>
          <Link className="underline underline-offset-2" href="/r/demo-invalid-token">
            Manage: invalid token
          </Link>
        </div>
      </div>
    </div>
  );
}
