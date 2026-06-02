import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Layout";
import {
  COMMISSION_RATE, getBankDetails, getClaim, payoutEtaDays,
  saveBankDetails, type BankDetails, type Claim,
} from "@/lib/claims";

export const Route = createFileRoute("/_authenticated/bank/$id")({
  component: BankDetailsScreen,
  head: () => ({ meta: [{ title: "Bank details · RefundHunters" }] }),
});

function BankDetailsScreen() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [existing, setExisting] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [holder, setHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await getClaim(id);
        setClaim(c);
        if (c) {
          const b = await getBankDetails(c.id);
          if (b) {
            setExisting(b);
            setHolder(b.account_holder);
            setIban(b.iban);
            setBic(b.bic ?? "");
          }
        }
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) {
    return <Shell><p className="text-center text-muted-foreground pt-10">Loading…</p></Shell>;
  }

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
  const disabled = claim.status === "paid";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await saveBankDetails(claim.id, { account_holder: holder, iban, bic });
      navigate({ to: "/claims/$id", params: { id: claim.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-xl pt-6">
        <Link to="/claims/$id" params={{ id: claim.id }} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to claim
        </Link>

        <div className="mt-4 rounded-3xl bg-accent text-accent-foreground p-7">
          <p className="text-sm font-bold uppercase tracking-wide">🎉 Refund approved</p>
          <p className="text-4xl font-bold mt-2">€{youGet.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            {claim.carrier} · {claim.origin} → {claim.destination}
          </p>
          <p className="text-xs opacity-70 mt-2">
            Total €{amount.toFixed(2)} · 18% success fee (€{fee.toFixed(2)}) · Payout in ~{eta} days
          </p>
        </div>

        <section className="mt-6 rounded-2xl bg-card border border-border p-6">
          <h1 className="text-xl font-semibold">
            {existing ? "Update bank details" : "Where should we send your refund?"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {disabled
              ? "This refund has already been paid out."
              : "Enter the account that should receive the payout. Stored securely and only used for this claim."}
          </p>

          <form onSubmit={submit} className="mt-5 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account holder</span>
              <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Jane Doe"
                required disabled={disabled} maxLength={100}
                className="rounded-xl border border-border bg-background px-4 py-3 disabled:opacity-60" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IBAN</span>
              <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="BE68 5390 0754 7034"
                required disabled={disabled} maxLength={42}
                className="rounded-xl border border-border bg-background px-4 py-3 font-mono uppercase disabled:opacity-60" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">BIC (optional)</span>
              <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="GKCCBEBB"
                disabled={disabled} maxLength={11}
                className="rounded-xl border border-border bg-background px-4 py-3 font-mono uppercase disabled:opacity-60" />
            </label>

            {err && <p className="text-sm text-destructive">{err}</p>}

            {!disabled && (
              <button type="submit" disabled={busy}
                className="mt-2 rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
                {busy ? "Saving…" : existing ? "Update details" : "Confirm & request payout"}
              </button>
            )}
          </form>
        </section>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          🔒 We never share your bank info. Used only to send your refund.
        </p>
      </div>
    </Shell>
  );
}
