import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import {
  advanceStatus, COMMISSION_RATE, deleteClaim, getBankDetails, getClaim, payoutEtaDays,
  saveBankDetails, STATUS_FLOW, STATUS_LABEL, type BankDetails, type Claim, type ClaimStatus,
} from "@/lib/claims";

export const Route = createFileRoute("/_authenticated/claims/$id")({
  component: ClaimDetail,
});

function ClaimDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await getClaim(id);
        setClaim(c);
        if (c) setBank(await getBankDetails(c.id));
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Shell><p className="text-center text-muted-foreground pt-10">Loading…</p></Shell>;

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

  const amount = Number(claim.estimated_compensation);
  const fee = amount * COMMISSION_RATE;
  const youGet = amount - fee;
  const eta = payoutEtaDays(claim.transport_type);

  const advance = async (next: ClaimStatus, label: string) => {
    const updated = await advanceStatus(claim, next, label);
    setClaim(updated);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl pt-6">
        <Link to="/claims" className="text-sm text-muted-foreground hover:text-foreground">← All claims</Link>

        <div className="mt-4 rounded-3xl bg-primary text-primary-foreground p-7">
          <p className="text-sm opacity-80">{claim.carrier} · {claim.origin} → {claim.destination}</p>
          <p className="text-5xl font-bold mt-2">€{amount.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            You receive €{youGet.toFixed(2)} · 18% success fee (€{fee.toFixed(2)})
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {STATUS_LABEL[claim.status]}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Info label="Booking" value={claim.booking_reference} />
          <Info label="Date" value={new Date(claim.travel_date).toLocaleDateString()} />
          <Info label="Disruption" value={claim.disruption === "delay" ? `${claim.delay_minutes} min delay` : "Cancellation"} />
        </div>

        {claim.description && (
          <p className="mt-4 rounded-xl bg-card border border-border p-4 text-sm">{claim.description}</p>
        )}

        {/* Status tracker */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Progress</h2>
          <div className="flex items-center gap-2">
            {STATUS_FLOW.map((s, i) => {
              const idx = STATUS_FLOW.indexOf(claim.status as typeof s);
              const done = idx >= i && claim.status !== "rejected";
              return (
                <div key={s} className="flex-1">
                  <div className={`h-2 rounded-full ${done ? "bg-primary" : "bg-secondary"}`} />
                  <p className={`mt-2 text-[11px] text-center ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {STATUS_LABEL[s]}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Typical processing time: {eta} days ({claim.transport_type === "flight" ? "flights" : "trains"}).
          </p>
        </section>

        {/* Bank details after approval */}
        {(claim.status === "approved" || claim.status === "paid") && (
          <BankSection claimId={claim.id} initial={bank} onSaved={setBank} disabled={claim.status === "paid"} />
        )}

        {/* Timeline */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Timeline</h2>
          <ol className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {claim.timeline.map((t, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm">{t.label}</span>
                <span className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Simulate progression */}
        <section className="mt-6 flex flex-wrap gap-2">
          {claim.status === "submitted" && (
            <button onClick={() => advance("under_review", "Carrier started reviewing")} className="rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              Simulate review
            </button>
          )}
          {claim.status === "under_review" && (
            <button onClick={() => advance("approved", "Carrier approved compensation")} className="rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              Simulate approval
            </button>
          )}
          {claim.status === "approved" && bank && (
            <button onClick={() => advance("paid", "Refund paid to bank account")} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
              Mark as paid
            </button>
          )}
          <button
            onClick={async () => { await deleteClaim(claim.id); navigate({ to: "/claims" }); }}
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
      <p className="mt-1 text-base font-semibold break-words">{value}</p>
    </div>
  );
}

function BankSection({ claimId, initial, onSaved, disabled }: {
  claimId: string;
  initial: BankDetails | null;
  onSaved: (b: BankDetails) => void;
  disabled: boolean;
}) {
  const [holder, setHolder] = useState(initial?.account_holder ?? "");
  const [iban, setIban] = useState(initial?.iban ?? "");
  const [bic, setBic] = useState(initial?.bic ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await saveBankDetails(claimId, { account_holder: holder, iban, bic });
      setOk(true);
      onSaved({ id: initial?.id ?? "", claim_id: claimId, account_holder: holder, iban: iban.replace(/\s+/g, "").toUpperCase(), bic: bic || null });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally { setBusy(false); }
  };

  return (
    <section className="mt-8 rounded-2xl bg-card border border-border p-6">
      <h2 className="text-lg font-semibold">{initial ? "Payout details" : "Add your bank details"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {disabled
          ? "Payout sent to the account below."
          : "We need these to send your refund. Stored securely and only used for this payout."}
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Account holder name"
          required disabled={disabled}
          className="rounded-xl border border-border bg-background px-4 py-3 disabled:opacity-60" />
        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN — e.g. BE68 5390 0754 7034"
          required disabled={disabled}
          className="rounded-xl border border-border bg-background px-4 py-3 font-mono disabled:opacity-60" />
        <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC (optional)"
          disabled={disabled}
          className="rounded-xl border border-border bg-background px-4 py-3 font-mono disabled:opacity-60" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        {ok && <p className="text-sm text-primary">Saved. We'll process your payout shortly.</p>}
        {!disabled && (
          <button type="submit" disabled={busy} className="rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
            {busy ? "Saving…" : initial ? "Update details" : "Save bank details"}
          </button>
        )}
      </form>
    </section>
  );
}
