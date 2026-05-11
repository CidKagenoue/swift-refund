import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logo}
        alt="RefundHunters logo"
        width={32}
        height={32}
        className="h-8 w-8 rounded-xl"
      />
      <span className="text-lg font-semibold tracking-tight">RefundHunters</span>
    </Link>
  );
}
