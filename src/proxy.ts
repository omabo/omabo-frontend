import { NextRequest, NextResponse } from "next/server";

// ローカル: {slug}.book.omabo.local / app.omabo.local
// 本番    : {slug}.book.omabo.jp   / app.omabo.jp
const BASE_DOMAIN = process.env.BASE_DOMAIN ?? "omabo.local";
const BOOKING_SUFFIX = `.book.${BASE_DOMAIN}`;

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
  } else {
    url.pathname = `/admin${url.pathname}`;
  }

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // 静的アセット (/_next/*) はリライト対象から除外する
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
