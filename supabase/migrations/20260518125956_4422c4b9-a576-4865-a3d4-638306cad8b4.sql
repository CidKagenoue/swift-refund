
-- Claims
CREATE TYPE public.claim_status AS ENUM ('submitted','under_review','approved','paid','rejected');
CREATE TYPE public.disruption_type AS ENUM ('delay','cancellation');
CREATE TYPE public.transport_type AS ENUM ('flight','train');

CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  transport_type public.transport_type NOT NULL,
  booking_reference TEXT NOT NULL,
  travel_date DATE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  disruption public.disruption_type NOT NULL,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  flight_distance_km INTEGER,
  ticket_price NUMERIC(10,2),
  estimated_compensation NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.claim_status NOT NULL DEFAULT 'submitted',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims_select_own" ON public.claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "claims_insert_own" ON public.claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "claims_update_own" ON public.claims FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "claims_delete_own" ON public.claims FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER claims_touch BEFORE UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bank details per claim
CREATE TABLE public.bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL UNIQUE REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder TEXT NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_select_own" ON public.bank_details FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bank_insert_own" ON public.bank_details FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bank_update_own" ON public.bank_details FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bank_delete_own" ON public.bank_details FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for proof uploads (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('claim-attachments','claim-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "claim_attachments_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'claim-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "claim_attachments_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'claim-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "claim_attachments_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'claim-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "claim_attachments_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'claim-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
