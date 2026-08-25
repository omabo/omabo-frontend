import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session-constants";
import { CONSOLE_SESSION_COOKIE } from "@/lib/console/session-constants";

// ローカル: {slug}.book.omabo.local / app.omabo.local
// 本番    : {slug}.book.omabo.jp   / app.omabo.jp
const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "omabo.local";
const BOOKING_SUFFIX = `.book.${BASE_DOMAIN}`;

const ADMIN_PUBLIC_PATHS = ["/login"];
const CONSOLE_LOGIN_PATH = "/admin-console/login";

function extractTenantSlug(hostname: string): string | null {
  if (!hostname.endsWith(BOOKING_SUFFIX)) {
    return null;
  }
  const slug = hostname.slice(0, -BOOKING_SUFFIX.length);
  return slug.length > 0 ? slug : null;
}

// (admin) と (booking) はどちらも app/ 直下のルートグループで URL 上は "/" に
// 解決されるため、同じ path に両方の page.tsx を置くと Next.js のビルドが
// 衝突する。ここでホストに応じて内部的に /admin または /booking へ
// リライトすることで、ブラウザ側の URL を変えずに実体を振り分ける。
export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const tenantSlug = extractTenantSlug(hostname);

  const url = request.nextUrl.clone();
  const requestHeaders = new Headers(request.headers);

  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
    url.pathname = `/booking${url.pathname}`;
  } else if (url.pathname.startsWith("/admin-console")) {
    // プラットフォーム運営者向けの別領域。テナント管理画面(/admin)とは
    // セッションを完全に分離し、URL空間も分ける(docs/screens.md)。
    // ファイル配置がパスとそのまま一致するため /admin のような prefix は不要。
    const hasConsoleSession = request.cookies.has(CONSOLE_SESSION_COOKIE);
    if (!hasConsoleSession && url.pathname !== CONSOLE_LOGIN_PATH) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = CONSOLE_LOGIN_PATH;
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const hasSession = request.cookies.has(ADMIN_SESSION_COOKIE);
    const isPublicPath = ADMIN_PUBLIC_PATHS.includes(request.nextUrl.pathname);
    if (!hasSession && !isPublicPath) {
      // Session-expired-or-missing: bounce to login, but remember where the
      // user was headed so they land back there after signing in.
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    url.pathname = `/admin${url.pathname}`;
  }

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // 静的アセット (/_next/*) はリライト対象から除外する
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
