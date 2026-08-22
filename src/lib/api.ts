// backend の疎通確認用クライアント。API 型は backend から生成されるため
// (src/generated/ 参照)、ここでは手書きの DTO を持たない。

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";

interface HealthzResponse {
  status: string;
}

export async function fetchHealthz(): Promise<HealthzResponse> {
  const res = await fetch(`${BACKEND_INTERNAL_URL}/healthz`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`healthz check failed: ${res.status}`);
  }

  return res.json() as Promise<HealthzResponse>;
}
