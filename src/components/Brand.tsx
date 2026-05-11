import { Link } from "@tanstack/react-router";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
        R
      </span>
      <span className="text-lg font-semibold tracking-tight">RefundFlow</span>
    </Link>
  );
}
