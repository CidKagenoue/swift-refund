import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import { loadClaims, type Claim } from "@/lib/claims";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "RefundFlow — Get your train & flight refund in 2 minutes" },
      {
        name: "description",
        content:
          "Forward an email or snap a ticket. RefundFlow handles SNCB and Brussels Airlines compensation claims for you. No win, no fee.",
      },
    ],
  }),
});

function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  useEffect(() => setClaims(loadClaims()), []);

  return (
    <Shell>
      <section className="mx-auto max-w-3xl pt-8 sm:pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          Live in Belgium · SNCB & Brussels Airlines
        </span>

        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          Delayed?<br />
          <span className="text-primary">Get your money back.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Forward your ticket. We do the paperwork, write the email, and chase the refund.
          You only pay if it works.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/new"
            className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-base font-semibold shadow-[var(--shadow-pop)] hover:opacity-95 transition w-full sm:w-auto"
          >
            Start a refund →
          </Link>
          <Link
            to="/claims"
            className="inline-flex items-center justify-center rounded-2xl bg-card px-6 py-4 text-base font-semibold border border-border hover:bg-secondary transition w-full sm:w-auto"
          >
            See my claims
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">2 minutes · No account needed to start</p>
      </section>

      <section className="mx-auto max-w-5xl mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { n: "1", t: "Send us your ticket", d: "Upload a PDF, screenshot, or just type the route." },
          { n: "2", t: "We check the rules", d: "Eligibility, amount, and the right form — instantly." },
          { n: "3", t: "Refund lands in your account", d: "We follow up until the carrier pays out." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl bg-card p-6 border border-border shadow-[var(--shadow-soft)]">
            <div className="h-8 w-8 rounded-xl bg-accent text-accent-foreground inline-flex items-center justify-center text-sm font-bold">
              {s.n}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </section>

      {claims.length > 0 && (
        <section className="mx-auto max-w-3xl mt-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your recent claims</h2>
            <Link to="/claims" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {claims.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                to="/claims/$id"
                params={{ id: c.id }}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition"
              >
                <div>
                  <p className="font-medium">{c.company} · {c.route}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString()} · {c.delayMinutes} min delay</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">€{c.estimatedRefund.toFixed(2)}</p>
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

function StatusBadge({ status }: { status: Claim["status"] }) {
  const map: Record<Claim["status"], string> = {
    pending: "bg-muted text-muted-foreground",
    submitted: "bg-accent text-accent-foreground",
    approved: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    paid: "bg-success/20 text-success-foreground",
  };
  return (
    <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
}
