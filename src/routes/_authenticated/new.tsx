import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Layout";
import {
  CARRIERS, type Carrier, type DisruptionType,
  createClaim, estimateCompensation, inferTransport, uploadAttachment, type Attachment,
} from "@/lib/claims";

export const Route = createFileRoute("/_authenticated/new")({
  component: NewClaim,
  head: () => ({
    meta: [
      { title: "Start a refund · RefundHunters" },
      { name: "description", content: "Enter your booking details to claim compensation for delays or cancellations." },
    ],
  }),
});

function NewClaim() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [carrier, setCarrier] = useState<Carrier>("SNCB / NMBS");
  const [bookingRef, setBookingRef] = useState("");

  // Step 2
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Step 3
  const [disruption, setDisruption] = useState<DisruptionType>("delay");
  const [delay, setDelay] = useState("60");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [distance, setDistance] = useState("");

  // Step 4
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const transport = inferTransport(carrier);
  const delayMin = Number(delay) || 0;
  const ticketPrice = price ? Number(price) : null;
  const flightKm = distance ? Number(distance) : null;

  const estimate = estimateCompensation({
    transport, disruption, delayMinutes: delayMin,
    ticketPrice, flightDistanceKm: flightKm,
  });

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canProceed =
    (step === 1 && carrier && bookingRef.trim().length > 0) ||
    (step === 2 && date && from.trim() && to.trim()) ||
    (step === 3 && (disruption === "cancellation" || delayMin > 0)) ||
    step === 4;

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const attachments: Attachment[] = [];
      for (const f of files) attachments.push(await uploadAttachment(f));
      const claim = await createClaim({
        carrier,
        transport_type: transport,
        booking_reference: bookingRef.trim(),
        travel_date: date,
        origin: from.trim(),
        destination: to.trim(),
        disruption,
        delay_minutes: delayMin,
        description: description.trim() || undefined,
        flight_distance_km: flightKm,
        ticket_price: ticketPrice,
        attachments,
      });
      navigate({ to: "/claims/$id", params: { id: claim.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-xl pt-6">
        <Link to="/claims" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>

        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Step {step} of 4</p>

        {step === 1 && (
          <section className="mt-6 grid gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Booking details</h1>
            <Field label="Carrier">
              <select value={carrier} onChange={(e) => setCarrier(e.target.value as Carrier)} className={inputCls}>
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Booking reference">
              <input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder="e.g. ABC123" className={inputCls} />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section className="mt-6 grid gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Journey</h1>
            <Field label="Travel date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="From"><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={transport === "train" ? "Brussels Midi" : "Brussels Airport"} className={inputCls} /></Field>
              <Field label="To"><input value={to} onChange={(e) => setTo(e.target.value)} placeholder={transport === "train" ? "Paris Nord" : "London Heathrow"} className={inputCls} /></Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-6 grid gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">What happened?</h1>
            <Field label="Type of disruption">
              <div className="grid grid-cols-2 gap-2">
                {(["delay", "cancellation"] as const).map((d) => (
                  <button key={d} type="button" onClick={() => setDisruption(d)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize ${disruption === d ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            {disruption === "delay" && (
              <Field label="Delay (minutes)">
                <input type="number" min={0} value={delay} onChange={(e) => setDelay(e.target.value)} className={inputCls} />
              </Field>
            )}
            {transport === "train" && (
              <Field label="Ticket price (€)">
                <input type="number" min={0} step={0.5} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 12" className={inputCls} />
              </Field>
            )}
            {transport === "flight" && (
              <Field label="Flight distance (km, approx)">
                <select value={distance} onChange={(e) => setDistance(e.target.value)} className={inputCls}>
                  <option value="">Pick a range</option>
                  <option value="1000">Short — under 1500 km (€250)</option>
                  <option value="2500">Medium — 1500–3500 km (€400)</option>
                  <option value="5000">Long — over 3500 km (€600)</option>
                </select>
              </Field>
            )}
            <Field label="What happened (optional)">
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the disruption" className={inputCls} />
            </Field>

            <div className="rounded-xl bg-accent/40 px-4 py-3 flex items-center justify-between">
              <span className="text-sm">Estimated compensation</span>
              <span className="text-2xl font-bold">€{estimate.toFixed(2)}</span>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="mt-6 grid gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Upload proof</h1>
            <p className="text-sm text-muted-foreground">Add a ticket, boarding pass, or official delay confirmation. Optional but speeds up review.</p>

            <label className="rounded-xl border-2 border-dashed border-border bg-background p-6 text-center cursor-pointer hover:border-primary">
              <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
              <p className="text-sm text-muted-foreground">
                {files.length === 0 ? "Click to choose files" : `${files.length} file(s) selected`}
              </p>
            </label>

            {files.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {files.map((f, i) => <li key={i}>• {f.name}</li>)}
              </ul>
            )}

            <div className="rounded-xl bg-card border border-border p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span>{carrier}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Booking</span><span>{bookingRef}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span>{from} → {to}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Disruption</span><span className="capitalize">{disruption}{disruption === "delay" ? ` · ${delayMin} min` : ""}</span></div>
              <div className="flex justify-between font-semibold"><span>Estimated</span><span>€{estimate.toFixed(2)}</span></div>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </section>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button onClick={back} disabled={step === 1} className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium disabled:opacity-40">Back</button>
          {step < 4 ? (
            <button onClick={next} disabled={!canProceed} className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold disabled:opacity-40">
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={busy} className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold disabled:opacity-40">
              {busy ? "Submitting…" : "Submit claim"}
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
