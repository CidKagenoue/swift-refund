import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="px-3 py-2 rounded-lg hover:bg-secondary transition"
            activeProps={{ className: "px-3 py-2 rounded-lg bg-secondary" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/claims"
            className="px-3 py-2 rounded-lg hover:bg-secondary transition"
            activeProps={{ className: "px-3 py-2 rounded-lg bg-secondary" }}
          >
            Claims
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-5 sm:px-8 pb-16">{children}</main>
      <footer className="px-5 sm:px-8 py-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <Brand className="text-foreground" />
          <span>© {new Date().getFullYear()} RefundHunters — only pay if you get refunded.</span>
        </span>
        <span>18% success fee · No win, no fee</span>
      </footer>
    </div>
  );
}
