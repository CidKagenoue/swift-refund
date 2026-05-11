import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Layout";
import { addClaim, estimateRefund } from "@/lib/claims";

export const Route = createFileRoute("/new")({
  component: NewClaim,
  head: () => ({
    meta: [
      { title: "Start a refund · RefundFlow" },
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
            company: "SNCB",
            route: "Brussels Midi → Antwerpen Centraal",
            date: new Date().toISOString().slice(0, 10),
            delayMinutes: 65,
            estimatedRefund: estimateRefund("SNCB", 65),
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
      <div className="mt-3 rounded-xl bg-secondary px-4 py-3 font-mono text-sm">claims@refundflow.app</div>
      <p className="mt-3 text-xs text-muted-foreground">
        Or connect your inbox to detect delays automatically — coming soon.
      </p>
    </div>
  );
}

function ManualForm() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<"SNCB" | "Brussels Airlines" | "Other">("SNCB");
  const [route, setRoute] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [delay, setDelay] = useState(60);

  const refund = estimateRefund(company, delay);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const claim = addClaim({
      company,
      route: route || "—",
      date,
      delayMinutes: delay,
      estimatedRefund: refund,
    });
    navigate({ to: "/claims/$id", params: { id: claim.id } });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 grid gap-4">
      <Field label="Carrier">
        <div className="flex gap-2">
          {(["NS", "KLM", "Other"] as const).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCompany(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                company === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Route">
        <input
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          placeholder="e.g. Amsterdam → Paris"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </Field>
      <Field label={`Delay: ${delay} min`}>
        <input
          type="range"
          min={0}
          max={300}
          step={5}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="w-full accent-[color:var(--primary)]"
        />
      </Field>

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
