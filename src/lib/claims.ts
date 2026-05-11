export type ClaimStatus = "pending" | "submitted" | "approved" | "rejected" | "paid";

export type Claim = {
  id: string;
  company: "SNCB" | "Brussels Airlines" | "Other";
  route: string;
  date: string;
  delayMinutes: number;
  ticketType?: string;
  estimatedRefund: number;
  status: ClaimStatus;
  createdAt: string;
  timeline: { at: string; label: string }[];
};

const KEY = "refundflow.claims.v1";

export function loadClaims(): Claim[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveClaims(claims: Claim[]) {
  localStorage.setItem(KEY, JSON.stringify(claims));
}

export function addClaim(c: Omit<Claim, "id" | "createdAt" | "status" | "timeline">): Claim {
  const claim: Claim = {
    ...c,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "submitted",
    timeline: [
      { at: new Date().toISOString(), label: "Claim created" },
      { at: new Date().toISOString(), label: "Submitted to carrier" },
    ],
  };
  const all = loadClaims();
  all.unshift(claim);
  saveClaims(all);
  return claim;
}

export function estimateRefund(company: Claim["company"], delayMinutes: number, ticketPrice?: number): number {
  // Belgian rules (simplified)
  if (company === "SNCB") {
    // NMBS/SNCB: 60+ min = 25% of ticket (min €4.20), 120+ min = 50%
    const price = ticketPrice ?? 12;
    if (delayMinutes >= 120) return Math.max(price * 0.5, 4.2);
    if (delayMinutes >= 60) return Math.max(price * 0.25, 4.2);
    return 0;
  }
  if (company === "Brussels Airlines") {
    // EU261 simplified (short-haul ≤1500km)
    if (delayMinutes >= 180) return 250;
    return 0;
  }
  if (delayMinutes >= 60) return 15;
  return 0;
}

export const COMMISSION_RATE = 0.18;
