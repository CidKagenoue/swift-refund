import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account · RefundHunters" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/claims" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/claims` },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) navigate({ to: "/claims" });
    else setInfo("Check your inbox to confirm your email, then sign in.");
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
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start claiming compensation in 2 minutes.</p>

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
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-border bg-background px-4 py-3" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="rounded-xl border border-border bg-background px-4 py-3" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}
            <button disabled={busy} type="submit" className="rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
