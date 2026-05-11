import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Layout";
import { addClaim, CARRIERS, type Carrier, carrierType, estimateRefund } from "@/lib/claims";

export const Route = createFileRoute("/new")({
  component: NewClaim,
  head: () => ({
    meta: [
      { title: "Start a refund · RefundHunters" },
      { name: "description", content: "Upload a ticket, forward an email, or enter details manually." },
    ],
  }),
});

type Method = "upload" | "email" | "manual";

function NewClaim() {
  const [method, setMethod] = useState<Method | null>(null);

  return (
    <Shell>
      <div className="mx-auto max-w-xl pt-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">How can we get your ticket?</h1>
        <p className="mt-2 text-muted-foreground">Pick the fastest option for you.</p>

        <div className="mt-8 grid gap-3">
          <MethodCard
            active={method === "upload"}
            onClick={() => setMethod("upload")}
            title="Upload a ticket"
            sub="PDF, screenshot, or photo"
            emoji="📎"
          />
          <MethodCard
            active={method === "email"}
            onClick={() => setMethod("email")}
            title="Forward the email"
            sub="Send your booking confirmation to us"
            emoji="✉️"
          />
          <MethodCard
            active={method === "manual"}
            onClick={() => setMethod("manual")}
            title="Enter details manually"
            sub="Takes about a minute"
            emoji="✍️"
          />
        </div>

        <div className="mt-8">
          {method === "upload" && <UploadPanel />}
          {method === "email" && <EmailPanel />}
          {method === "manual" && <ManualForm />}
        </div>
      </div>
    </Shell>
  );
}

function MethodCard({
  active,
  onClick,
  title,
  sub,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  emoji: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition flex items-center gap-4 ${
        active
          ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <label className="block">
        <div className="rounded-xl border-2 border-dashed border-border bg-background p-8 text-center cursor-pointer hover:border-primary transition">
          <p className="text-sm text-muted-foreground">
            {file ? <span className="text-foreground font-medium">{file.name}</span> : "Drop your ticket here or click to choose"}
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </label>
      <button
        disabled={!file}
        onClick={() => {
          // Demo: extract -> seed with SNCB defaults
          const claim = addClaim({
            company: "SNCB / NMBS",
            route: "Brussels Midi → Antwerpen Centraal",
            date: new Date().toISOString().slice(0, 10),
            delayMinutes: 65,
            ticketPrice: 12,
            estimatedRefund: estimateRefund("SNCB / NMBS", 65, 12),
          });
          navigate({ to: "/claims/$id", params: { id: claim.id } });
        }}
        className="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-40"
      >
        Analyze ticket
      </button>
      <p className="mt-2 text-xs text-muted-foreground text-center">We auto-extract route, date and delay.</p>
    </div>
  );
}

function EmailPanel() {
  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <p className="text-sm text-muted-foreground">Forward your booking or delay confirmation to:</p>
      <div className="mt-3 rounded-xl bg-secondary px-4 py-3 font-mono text-sm">claims@refundhunters.app</div>
      <p className="mt-3 text-xs text-muted-foreground">
        Or connect your inbox to detect delays automatically — coming soon.
      </p>
    </div>
  );
}

function ManualForm() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Carrier>("SNCB / NMBS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [delay, setDelay] = useState("60");
  const [price, setPrice] = useState("12");

  const isRail = carrierType(company) === "rail";
  const isAir = carrierType(company) === "air";
  const delayMinutes = Number(delay) || 0;
  const ticketPrice = Number(price) || 0;
  const refund = estimateRefund(company, delayMinutes, ticketPrice);
  const presetDelays = [30, 60, 90, 120, 180];
  const routeFromOptions = isRail
    ? ["Brussels Midi", "Antwerpen Centraal", "Gent-Sint-Pieters", "Liège-Guillemins", "Paris Nord"]
    : ["Brussels Airport", "Brussels South Charleroi", "London Heathrow", "Paris Charles de Gaulle", "Barcelona El Prat"];
  const routeToOptions = isRail
    ? ["Antwerpen Centraal", "Gent-Sint-Pieters", "Liège-Guillemins", "Paris Nord", "Amsterdam Centraal"]
    : ["London Heathrow", "Paris Charles de Gaulle", "Barcelona El Prat", "Rome Fiumicino", "Amsterdam Schiphol"];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const claim = addClaim({
      company,
      route: `${from || "—"} → ${to || "—"}`,
      date,
      delayMinutes,
      ticketPrice: isRail ? ticketPrice : undefined,
      estimatedRefund: refund,
    });
    navigate({ to: "/claims/$id", params: { id: claim.id } });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 grid gap-4">
      <Field label="Carrier">
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value as Carrier)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Route">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">From</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={isRail ? "Brussels Midi" : "Brussels Airport"}
              list="route-from-options"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">To</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={isRail ? "Paris Nord" : "London Heathrow"}
              list="route-to-options"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </div>
        </div>
        <datalist id="route-from-options">
          {routeFromOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <datalist id="route-to-options">
          {routeToOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </Field>
      <Field label="Date">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </Field>
      <Field label="Delay (minutes)">
        <div className="flex gap-2 mb-2">
          {presetDelays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDelay(String(d))}
              aria-pressed={delayMinutes === d}
              className={`rounded-full px-3 py-1 text-sm transition border ${
                delayMinutes === d ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
        <input
          type="number"
          min={0}
          max={300}
          step={1}
          value={delay}
          onChange={(e) => setDelay(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
        {isAir && (
          <p className="mt-2 text-xs text-muted-foreground">
            Flight claims usually start at 3 hours+ delay. Longer delays matter more for compensation, especially on longer routes.
          </p>
        )}
      </Field>
      {isRail && (
        <Field label="Ticket price (€)">
          <input
            type="number"
            min={0}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </Field>
      )}

      <div className="rounded-xl bg-accent/40 px-4 py-3 flex items-center justify-between">
        <span className="text-sm">Estimated refund</span>
        <span className="text-2xl font-bold">€{refund.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={refund <= 0}
        className="mt-2 rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-40"
      >
        {refund > 0 ? "Submit claim" : "Not eligible — try a longer delay"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
