import { supabase } from "@/integrations/supabase/client";

export const CARRIERS = [
  "SNCB / NMBS",
  "Eurostar",
  "TGV INOUI",
  "ICE (Deutsche Bahn)",
  "Nightjet (ÖBB)",
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
export type TransportType = "flight" | "train";
export type DisruptionType = "delay" | "cancellation";
export type ClaimStatus = "submitted" | "under_review" | "approved" | "paid" | "rejected";

export type TimelineEntry = { at: string; label: string };
export type Attachment = { path: string; name: string };

export type Claim = {
  id: string;
  user_id: string;
  carrier: string;
  transport_type: TransportType;
  booking_reference: string;
  travel_date: string;
  origin: string;
  destination: string;
  disruption: DisruptionType;
  delay_minutes: number;
  description: string | null;
  flight_distance_km: number | null;
  ticket_price: number | null;
  estimated_compensation: number;
  status: ClaimStatus;
  attachments: Attachment[];
  timeline: TimelineEntry[];
  created_at: string;
  updated_at: string;
};

const RAIL: Carrier[] = ["SNCB / NMBS", "Eurostar", "TGV INOUI", "ICE (Deutsche Bahn)", "Nightjet (ÖBB)"];

export function inferTransport(c: string): TransportType {
  return (RAIL as string[]).includes(c) ? "train" : "flight";
}

/** EU261 for flights, Delay Repay for trains. */
export function estimateCompensation(args: {
  transport: TransportType;
  disruption: DisruptionType;
  delayMinutes: number;
  ticketPrice?: number | null;
  flightDistanceKm?: number | null;
}): number {
  const { transport, disruption, delayMinutes, ticketPrice, flightDistanceKm } = args;

  if (transport === "flight") {
    // EU261: cancellations qualify like a 3h+ delay; otherwise need delay >= 180.
    const qualifies = disruption === "cancellation" || delayMinutes >= 180;
    if (!qualifies) return 0;
    const km = flightDistanceKm ?? 1500;
    if (km <= 1500) return 250;
    if (km <= 3500) return 400;
    return 600;
  }

  // Train — delay repay
  if (disruption === "cancellation") {
    return ticketPrice ?? 0; // full refund
  }
  const price = ticketPrice ?? 0;
  if (delayMinutes >= 120) return Math.max(price * 0.5, 4.2);
  if (delayMinutes >= 60) return Math.max(price * 0.25, 4.2);
  return 0;
}

export const COMMISSION_RATE = 0.18;

export function payoutEtaDays(transport: TransportType): number {
  return transport === "flight" ? 7 : 28;
}

export const STATUS_FLOW: ClaimStatus[] = ["submitted", "under_review", "approved", "paid"];

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

// ---------- API ----------

export async function listClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Claim[];
}

export async function getClaim(id: string): Promise<Claim | null> {
  const { data, error } = await supabase.from("claims").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as Claim) ?? null;
}

export async function createClaim(input: {
  carrier: string;
  transport_type: TransportType;
  booking_reference: string;
  travel_date: string;
  origin: string;
  destination: string;
  disruption: DisruptionType;
  delay_minutes: number;
  description?: string;
  flight_distance_km?: number | null;
  ticket_price?: number | null;
  attachments?: Attachment[];
}): Promise<Claim> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");

  const estimated = estimateCompensation({
    transport: input.transport_type,
    disruption: input.disruption,
    delayMinutes: input.delay_minutes,
    ticketPrice: input.ticket_price,
    flightDistanceKm: input.flight_distance_km,
  });

  const timeline: TimelineEntry[] = [
    { at: new Date().toISOString(), label: "Claim created" },
    { at: new Date().toISOString(), label: "Submitted to carrier" },
  ];

  const { data, error } = await supabase
    .from("claims")
    .insert({
      user_id: user.id,
      carrier: input.carrier,
      transport_type: input.transport_type,
      booking_reference: input.booking_reference,
      travel_date: input.travel_date,
      origin: input.origin,
      destination: input.destination,
      disruption: input.disruption,
      delay_minutes: input.delay_minutes,
      description: input.description ?? null,
      flight_distance_km: input.flight_distance_km ?? null,
      ticket_price: input.ticket_price ?? null,
      estimated_compensation: estimated,
      status: "submitted",
      attachments: input.attachments ?? [],
      timeline,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Claim;
}

export async function advanceStatus(claim: Claim, next: ClaimStatus, label: string): Promise<Claim> {
  const timeline = [...claim.timeline, { at: new Date().toISOString(), label }];
  const { data, error } = await supabase
    .from("claims")
    .update({ status: next, timeline })
    .eq("id", claim.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Claim;
}

export async function deleteClaim(id: string): Promise<void> {
  const { error } = await supabase.from("claims").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Bank details ----------
export type BankDetails = {
  id: string;
  claim_id: string;
  account_holder: string;
  iban: string;
  bic: string | null;
};

export async function getBankDetails(claimId: string): Promise<BankDetails | null> {
  const { data, error } = await supabase
    .from("bank_details")
    .select("*")
    .eq("claim_id", claimId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as BankDetails) ?? null;
}

export async function saveBankDetails(claimId: string, b: { account_holder: string; iban: string; bic?: string }) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("bank_details").upsert(
    {
      claim_id: claimId,
      user_id: user.id,
      account_holder: b.account_holder,
      iban: b.iban.replace(/\s+/g, "").toUpperCase(),
      bic: b.bic ?? null,
    },
    { onConflict: "claim_id" },
  );
  if (error) throw error;
}

// ---------- Storage ----------
export async function uploadAttachment(file: File): Promise<Attachment> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("claim-attachments").upload(path, file, { upsert: false });
  if (error) throw error;
  return { path, name: file.name };
}
