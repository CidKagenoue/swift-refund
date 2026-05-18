import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import { listClaims, STATUS_LABEL, type Claim, type ClaimStatus } from "@/lib/claims";

export const Route = createFileRoute("/_authenticated/claims")({
  component: ClaimsPage,
  head: () => ({ meta: [{ title: "My claims · RefundHunters" }] }),
});

function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClaims().then((c) => { setClaims(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const pending = claims.filter((c) => c.status !== "paid" && c.status !== "rejected")
    .reduce((s, c) => s + Number(c.estimated_compensation), 0);
  const paid = claims.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.estimated_compensation), 0);

  return (
    <Shell>
      <div className="mx-auto max-w-3xl pt-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">My claims</h1>
          <Link to="/new" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold">
            + New claim
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="In progress" value={`€${pending.toFixed(2)}`} tone="primary" />
          <Stat label="Received" value={`€${paid.toFixed(2)}`} tone="accent" />
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
          ) : claims.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-10 text-center">
              <p className="text-muted-foreground">No claims yet.</p>
              <Link to="/new" className="inline-block mt-4 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold">
                Start your first refund
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
              {claims.map((c) => (
                <Link key={c.id} to="/claims/$id" params={{ id: c.id }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition">
                  <div>
                    <p className="font-medium">{c.carrier} · {c.origin} → {c.destination}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {new Date(c.travel_date).toLocaleDateString()} · {c.disruption}{c.disruption === "delay" ? ` · ${c.delay_minutes} min` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{Number(c.estimated_compensation).toFixed(2)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "primary" | "accent" }) {
  return (
    <div className={`rounded-2xl p-5 border ${tone === "primary" ? "bg-primary text-primary-foreground border-primary" : "bg-accent text-accent-foreground border-accent"}`}>
      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const map: Record<ClaimStatus, string> = {
    submitted: "bg-accent text-accent-foreground",
    under_review: "bg-secondary text-foreground",
    approved: "bg-primary/10 text-primary",
    paid: "bg-success/20 text-foreground",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
