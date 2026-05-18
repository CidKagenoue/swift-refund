import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Layout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "RefundHunters — Get your train & flight refund in 2 minutes" },
      {
        name: "description",
        content:
          "Claim compensation for delayed or cancelled flights and trains. EU261 for flights, Delay Repay for trains. No win, no fee.",
      },
    ],
  }),
});

function Home() {
  const { user } = useAuth();

  return (
    <Shell>
      <section className="mx-auto max-w-3xl pt-8 sm:pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          Live in Belgium · SNCB · Brussels Airlines · Ryanair · Eurostar +more
        </span>

        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          Delayed?<br />
          <span className="text-primary">Get your money back.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          We handle EU261 flight compensation (€250–€600) and train delay repay claims for you.
          You only pay if it works.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={user ? "/new" : "/signup"}
            className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-base font-semibold shadow-[var(--shadow-pop)] hover:opacity-95 transition w-full sm:w-auto">
            {user ? "Start a refund →" : "Get started →"}
          </Link>
          <Link to={user ? "/claims" : "/login"}
            className="inline-flex items-center justify-center rounded-2xl bg-card px-6 py-4 text-base font-semibold border border-border hover:bg-secondary transition w-full sm:w-auto">
            {user ? "See my claims" : "I have an account"}
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">2 minutes · 18% success fee</p>
      </section>

      <section className="mx-auto max-w-5xl mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { n: "1", t: "Enter your booking", d: "Carrier, route, date, and what went wrong." },
          { n: "2", t: "We calculate & file", d: "Compensation is calculated under EU261 / Delay Repay rules." },
          { n: "3", t: "Refund to your bank", d: "Once approved, add your IBAN and we pay out — flights ~7 days, trains up to 28." },
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
    </Shell>
  );
}
