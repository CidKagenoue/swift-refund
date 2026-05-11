import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import { loadClaims, type Claim } from "@/lib/claims";

export const Route = createFileRoute("/claims")({
  component: Claims,
  head: () => ({ meta: [{ title: "My claims · RefundFlow" }] }),
});

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  useEffect(() => setClaims(loadClaims()), []);

  const totalPending = claims
    .filter((c) => c.status !== "rejected" && c.status !== "paid")
    .reduce((s, c) => s + c.estimatedRefund, 0);
  const totalPaid = claims.filter((c) => c.status === "paid").reduce((s, c) => s + c.estimatedRefund, 0);

  return (
    <Shell>
      <div className="mx-auto max-w-3xl pt-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">My claims</h1>
          <Link
            to="/new"
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
          >
            + New claim
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="In progress" value={`€${totalPending.toFixed(2)}`} tone="primary" />
          <Stat label="Received" value={`€${totalPaid.toFixed(2)}`} tone="accent" />
        </div>

        <div className="mt-8">
          {claims.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-10 text-center">
              <p className="text-muted-foreground">No claims yet.</p>
              <Link
                to="/new"
                className="inline-block mt-4 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold"
              >
                Start your first refund
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
              {claims.map((c) => (
                <Link
                  key={c.id}
                  to="/claims/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-secondary transition"
                >
                  <div>
                    <p className="font-medium">{c.company} · {c.route}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString()} · {c.delayMinutes} min delay
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{c.estimatedRefund.toFixed(2)}</p>
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
    <div
      className={`rounded-2xl p-5 border ${
        tone === "primary" ? "bg-primary text-primary-foreground border-primary" : "bg-accent text-accent-foreground border-accent"
      }`}
    >
      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Claim["status"] }) {
  const map: Record<Claim["status"], string> = {
    pending: "bg-muted text-muted-foreground",
    submitted: "bg-accent text-accent-foreground",
    approved: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    paid: "bg-success/20 text-foreground",
  };
  return (
    <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
}
