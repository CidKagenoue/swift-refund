import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · RefundHunters" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/claims" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr(error.message);
    navigate({ to: "/claims" });
  };

  const google = async () => {
    setErr(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/claims" });
    if (res.error) setErr(res.error.message);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-5"><Brand /></header>
      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md mt-8">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to track and manage your refund claims.</p>

          <button
            onClick={google}
            className="mt-6 w-full rounded-xl border border-border bg-card py-3 font-medium hover:bg-secondary"
          >
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-border bg-background px-4 py-3"
            />
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-xl border border-border bg-background px-4 py-3"
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button disabled={busy} type="submit" className="rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground text-center">
            No account? <Link to="/signup" className="text-primary font-medium">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
