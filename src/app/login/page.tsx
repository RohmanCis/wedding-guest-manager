"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

function LoginForm() {
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      window.location.href = params.get("next") || "/";
    } else {
      setError("Invalid credentials.");
      setLoading(false);
    }
  }

  return (
    <main className="animate-page-in flex min-h-screen items-center justify-center bg-surface-0 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface-4 p-8 shadow-modal">
        <div className="mb-6 space-y-2 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-3 font-display text-base font-semibold text-accent-gold"
          >
            WG
          </span>
          <h1 className="font-display text-lg font-semibold text-accent-cream">
            Wedding Guest Manager
          </h1>
          <p className="text-xs text-muted">Masuk sebagai administrator</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Username" htmlFor="u">
            <Input
              id="u"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" htmlFor="p">
            <Input
              id="p"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Masuk
          </Button>
          {error && <Alert variant="error">{error}</Alert>}
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-0" />}>
      <LoginForm />
    </Suspense>
  );
}
