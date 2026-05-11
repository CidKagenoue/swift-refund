import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import { COMMISSION_RATE, loadClaims, saveClaims, type Claim } from "@/lib/claims";

export const Route = createFileRoute("/claims/$id")({
  component: ClaimDetail,
});

function ClaimDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);

  useEffect(() => {
    const found = loadClaims().find((c) => c.id === id) ?? null;
    setClaim(found);
  }, [id]);

  if (!claim) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl pt-10 text-center">
          <p className="text-muted-foreground">Claim not found.</p>
          <Link to="/claims" className="inline-block mt-4 text-primary font-medium">← Back to claims</Link>
        </div>
      </Shell>
    );
  }

  const fee = claim.estimatedRefund * COMMISSION_RATE;
  const youGet = claim.estimatedRefund - fee;

  const advance = (next: Claim["status"], label: string) => {
    const all = loadClaims();
    const updated = all.map((c) =>
      c.id === claim.id
        ? { ...c, status: next, timeline: [...c.timeline, { at: new Date().toISOString(), label }] }
        : c,
    );
    saveClaims(updated);
    setClaim(updated.find((c) => c.id === claim.id) ?? null);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl pt-6">
        <Link to="/claims" className="text-sm text-muted-foreground hover:text-foreground">← All claims</Link>

        <div className="mt-4 rounded-3xl bg-primary text-primary-foreground p-7">
          <p className="text-sm opacity-80">{claim.company} · {claim.route}</p>
          <p className="text-5xl font-bold mt-2">€{claim.estimatedRefund.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            You receive €{youGet.toFixed(2)} · 18% success fee (€{fee.toFixed(2)})
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {claim.status}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Info label="Date" value={new Date(claim.date).toLocaleDateString()} />
          <Info label="Delay" value={`${claim.delayMinutes} min`} />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Timeline</h2>
          <ol className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {claim.timeline.map((t, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm">{t.label}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(t.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          {claim.status === "submitted" && (
            <button
              onClick={() => advance("approved", "Carrier approved refund")}
              className="rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Simulate approval
            </button>
          )}
          {claim.status === "approved" && (
            <button
              onClick={() => advance("paid", "Refund paid out")}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Mark as paid
            </button>
          )}
          <button
            onClick={() => {
              const all = loadClaims().filter((c) => c.id !== claim.id);
              saveClaims(all);
              navigate({ to: "/claims" });
            }}
            className="ml-auto rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Delete claim
          </button>
        </section>
      </div>
    </Shell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
