"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  PhoneCall,
  Settings2,
  Boxes,
  LayoutGrid,
  Store,
  Users,
  Palette,
  Bell,
  History,
  LogOut,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/admin/copy";
import { logout } from "@/lib/admin/session";
import type { AdminSession } from "@/lib/admin/session-constants";

const PRIMARY_ITEMS = [
  { href: "/", label: copy.nav.dashboard, icon: LayoutDashboard },
  { href: "/reservations", label: copy.nav.calendar, icon: CalendarDays },
  { href: "/reservations/needs-review", label: copy.nav.needsReview, icon: ClipboardList, badgeKey: "needsReview" as const },
  { href: "/reservations/new", label: copy.nav.manualEntry, icon: PhoneCall },
  { href: "/inventory", label: copy.nav.inventory, icon: Boxes },
];

// admin専用画面。docs/screens.md共通異常系「機能の存在自体は隠さない」に
// 従い、staffでもリンクは表示したまま(アクセス時にページ側で権限エラー)。
const SETTINGS_ITEMS = [
  { href: "/settings/restaurant", label: copy.nav.restaurant, icon: Store },
  { href: "/settings/seating-plans", label: copy.nav.seatingPlans, icon: Settings2 },
  { href: "/settings/tables", label: copy.nav.tables, icon: LayoutGrid },
  { href: "/settings/users", label: copy.nav.users, icon: Users },
  { href: "/settings/lp-customization", label: copy.nav.lpCustomization, icon: Palette },
  { href: "/settings/notifications", label: copy.nav.notifications, icon: Bell },
  { href: "/audit-log", label: copy.nav.auditLog, icon: History },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badgeCount,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-4" />
      <span className="flex-1">{label}</span>
      {badgeCount ? (
        <Badge variant={active ? "secondary" : "destructive"} className="text-[10px]">
          {badgeCount}
        </Badge>
      ) : null}
    </Link>
  );
}

// 兄弟関係にあるルート同士(例: /reservations と /reservations/needs-review)が
// 単純な前方一致だとどちらもアクティブになってしまうため、最も具体的な
// (パスが長い)一致だけを採用する。
function bestMatchHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of [...PRIMARY_ITEMS, ...SETTINGS_ITEMS]) {
    const matches = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

export function AdminSidebar({ session, needsReviewCount }: { session: AdminSession; needsReviewCount: number }) {
  const pathname = usePathname();
  const activeHref = bestMatchHref(pathname);
  const isActive = (href: string) => href === activeHref;

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="font-heading text-lg font-semibold text-foreground">omabo</p>
        <p className="text-xs text-muted-foreground">{session.email}({session.role})</p>
      </div>
      <nav className="flex-1 space-y-4 p-2">
        <div className="space-y-1">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              badgeCount={item.badgeKey === "needsReview" ? needsReviewCount : undefined}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {copy.nav.settingsGroup}
          </p>
          {SETTINGS_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
          ))}
        </div>
      </nav>
      <form action={logout} className="border-t border-border p-2">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          {copy.nav.logout}
        </button>
      </form>
    </aside>
  );
}
