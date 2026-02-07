-- Migration 002: Potjes administratie & Notulen
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

-- ============================================
-- 1. Potje Toekenningen (budget per ambassadeur per jaar)
-- ============================================
CREATE TABLE IF NOT EXISTS potje_toekenningen (
    id SERIAL PRIMARY KEY,
    ambassadeur_id INTEGER REFERENCES ambassadeurs(id) ON DELETE CASCADE,
    jaar INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    bedrag DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    status TEXT DEFAULT 'toegekend', -- 'toegekend', 'actief', 'afgesloten'
    datum_toekenning DATE DEFAULT CURRENT_DATE,
    notities TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS voor potje_toekenningen
ALTER TABLE potje_toekenningen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read potje_toekenningen" ON potje_toekenningen
    FOR SELECT USING (true);

CREATE POLICY "Public can insert potje_toekenningen" ON potje_toekenningen
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update potje_toekenningen" ON potje_toekenningen
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete potje_toekenningen" ON potje_toekenningen
    FOR DELETE USING (true);

-- ============================================
-- 2. Potje Uitgaven (individuele uitgaven)
-- ============================================
CREATE TABLE IF NOT EXISTS potje_uitgaven (
    id SERIAL PRIMARY KEY,
    ambassadeur_id INTEGER REFERENCES ambassadeurs(id) ON DELETE CASCADE,
    jaar INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    bedrag DECIMAL(8,2) NOT NULL,
    omschrijving TEXT NOT NULL,
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- kerngroeplid dat het invoerde
);

-- RLS voor potje_uitgaven
ALTER TABLE potje_uitgaven ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read potje_uitgaven" ON potje_uitgaven
    FOR SELECT USING (true);

CREATE POLICY "Public can insert potje_uitgaven" ON potje_uitgaven
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update potje_uitgaven" ON potje_uitgaven
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete potje_uitgaven" ON potje_uitgaven
    FOR DELETE USING (true);

-- ============================================
-- 3. Notulen (vergaderverslagen metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS notulen (
    id SERIAL PRIMARY KEY,
    titel TEXT NOT NULL,
    datum DATE NOT NULL,
    aanwezig TEXT, -- komma-gescheiden namen
    bestand_url TEXT, -- URL naar PDF (docs/ folder of extern)
    samenvatting TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS voor notulen
ALTER TABLE notulen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read notulen" ON notulen
    FOR SELECT USING (true);

CREATE POLICY "Public can insert notulen" ON notulen
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update notulen" ON notulen
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete notulen" ON notulen
    FOR DELETE USING (true);

-- ============================================
-- 4. Contactberichten tabel (als nog niet bestaat)
-- ============================================
CREATE TABLE IF NOT EXISTS contactberichten (
    id SERIAL PRIMARY KEY,
    naam TEXT NOT NULL,
    email TEXT NOT NULL,
    onderwerp TEXT,
    bericht TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contactberichten ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'contactberichten' AND policyname = 'Public can insert contactberichten'
    ) THEN
        EXECUTE 'CREATE POLICY "Public can insert contactberichten" ON contactberichten FOR INSERT WITH CHECK (true)';
    END IF;
END $$;

-- ⚠️ SECURITY NOTE: These policies allow public read/write access.
-- The admin dashboard PIN provides client-side security.
-- For production, consider using Supabase Auth or service keys.
