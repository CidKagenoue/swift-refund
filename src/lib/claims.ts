export type ClaimStatus = "pending" | "submitted" | "approved" | "rejected" | "paid";

export const CARRIERS = [
  // Belgian rail
  "SNCB / NMBS",
  // International rail accessible from Belgium
  "Eurostar",
  "TGV INOUI",
  "ICE (Deutsche Bahn)",
  "Nightjet (ÖBB)",
  // Airlines flying from Brussels / Charleroi
  "Brussels Airlines",
  "Ryanair",
  "TUI fly",
  "Lufthansa",
  "Air France",
  "KLM",
  "easyJet",
  "Vueling",
  "Other",
] as const;

export type Carrier = (typeof CARRIERS)[number];

export type Claim = {
  id: string;
  company: Carrier;
  route: string;
  date: string;
  delayMinutes: number;
  ticketPrice?: number;
  estimatedRefund: number;
  status: ClaimStatus;
  createdAt: string;
  timeline: { at: string; label: string }[];
};

const KEY = "refundhunters.claims.v1";

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

const RAIL: Carrier[] = ["SNCB / NMBS", "Eurostar", "TGV INOUI", "ICE (Deutsche Bahn)", "Nightjet (ÖBB)"];
const AIRLINES: Carrier[] = [
  "Brussels Airlines",
  "Ryanair",
  "TUI fly",
  "Lufthansa",
  "Air France",
  "KLM",
  "easyJet",
  "Vueling",
];

export function carrierType(c: Carrier): "rail" | "air" | "other" {
  if (RAIL.includes(c)) return "rail";
  if (AIRLINES.includes(c)) return "air";
  return "other";
}

export function estimateRefund(company: Carrier, delayMinutes: number, ticketPrice?: number): number {
  const type = carrierType(company);

  if (company === "SNCB / NMBS") {
    // NMBS/SNCB: 60+ min = 25% (min €4.20), 120+ min = 50%
    const price = ticketPrice ?? 12;
    if (delayMinutes >= 120) return Math.max(price * 0.5, 4.2);
    if (delayMinutes >= 60) return Math.max(price * 0.25, 4.2);
    return 0;
  }

  if (type === "rail") {
    // EU rail passenger rights (CIV): 60+ min = 25%, 120+ min = 50% of ticket
    const price = ticketPrice ?? 40;
    if (delayMinutes >= 120) return price * 0.5;
    if (delayMinutes >= 60) return price * 0.25;
    return 0;
  }

  if (type === "air") {
    // EU261 simplified — assume short/medium haul from Belgium
    // <1500km → €250, 1500-3500km → €400, >3500km → €600
    if (delayMinutes >= 180) return 250;
    return 0;
  }

  if (delayMinutes >= 60) return 15;
  return 0;
}

export const COMMISSION_RATE = 0.18;
