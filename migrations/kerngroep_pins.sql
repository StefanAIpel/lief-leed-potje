-- Kerngroep PIN authenticatie tabel
-- Voer dit uit in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS kerngroep_pins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text UNIQUE NOT NULL,
  email text NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  laatst_ingelogd timestamptz
);

-- RLS policies
ALTER TABLE kerngroep_pins ENABLE ROW LEVEL SECURITY;

-- Anon kan namen lezen (voor dropdown) en pin_hash (voor client-side verificatie)
CREATE POLICY "Anon kan kerngroep_pins lezen" ON kerngroep_pins
  FOR SELECT TO anon USING (true);

-- Anon kan laatst_ingelogd updaten
CREATE POLICY "Anon kan laatst_ingelogd updaten" ON kerngroep_pins
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Service role heeft volledige toegang (voor reset-pin function)
-- (service_role bypassed RLS automatisch)
