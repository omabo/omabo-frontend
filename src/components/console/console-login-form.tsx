"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { consoleCopy } from "@/lib/console/copy";
import { login } from "@/lib/console/session";
import { IDLE_CONSOLE_LOGIN_STATE } from "@/lib/console/session-constants";

export function ConsoleLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, IDLE_CONSOLE_LOGIN_STATE);
  // Controlled: form-action resets uncontrolled fields after each submit (see
  // src/components/admin/login-form.tsx for the same fix and why it's needed).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="font-semibold text-foreground">{consoleCopy.login.title}</h1>
        <p className="text-sm text-muted-foreground">{consoleCopy.login.subtitle}</p>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">{consoleCopy.login.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{consoleCopy.login.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {consoleCopy.login.submit}
      </Button>
    </form>
  );
}
