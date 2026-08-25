"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/admin/copy";
import { login } from "@/lib/admin/session";
import { IDLE_LOGIN_STATE } from "@/lib/admin/session-constants";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, IDLE_LOGIN_STATE);
  // Controlled on purpose: React resets uncontrolled fields in a form after
  // an action tied via `action={}` runs, which would silently blank the
  // password out from under a resubmit-after-error flow.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  if (state.status === "mfa-setup-required") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="stage" value="mfa-setup-confirm" />
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="next" value={state.next} />
        <h1 className="font-semibold text-foreground">{copy.login.mfaSetupTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.login.mfaSetupBody}</p>
        <Button type="submit" className="w-full" disabled={pending}>
          {copy.login.mfaSetupConfirm}
        </Button>
      </form>
    );
  }

  if (state.status === "mfa-challenge") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="stage" value="mfa" />
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="next" value={state.next} />
        <h1 className="font-semibold text-foreground">{copy.login.mfaTitle}</h1>
        <div className="space-y-1.5">
          <Label htmlFor="mfaCode">{copy.login.mfaCode}</Label>
          <Input
            id="mfaCode"
            name="mfaCode"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {copy.login.mfaSubmit}
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="stage" value="credentials" />
      <input type="hidden" name="next" value={next} />
      <h1 className="font-semibold text-foreground">{copy.login.title}</h1>
      {state.status === "error" ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">{copy.login.email}</Label>
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
        <Label htmlFor="password">{copy.login.password}</Label>
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
        {copy.login.submit}
      </Button>
    </form>
  );
}
