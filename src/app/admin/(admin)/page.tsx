import { fetchHealthz } from "@/lib/api";

export default async function AdminIndexPage() {
  let backendStatus: string;

  try {
    const healthz = await fetchHealthz();
    backendStatus = `接続済み（${healthz.status}）`;
  } catch {
    backendStatus = "未接続";
  }

  return (
    <main>
      <h1>OmaBo 管理画面</h1>
      <p>backend: {backendStatus}</p>
    </main>
  );
}
