import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <LoginForm next={next && next.startsWith("/") ? next : "/"} />
        <p className="text-xs text-muted-foreground">
          デモ用: パスワードに &quot;wrong&quot;、メールに &quot;mfa&quot; または &quot;super&quot;
          を含めると、それぞれ認証失敗・MFA・super_admin設定必須の状態を確認できます。
        </p>
      </div>
    </main>
  );
}
