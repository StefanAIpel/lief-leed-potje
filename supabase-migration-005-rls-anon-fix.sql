-- ============================================
-- Migration 005: Fix RLS policies for admin panel (anon key)
-- Date: 2025-07-18
-- Problem: Admin panel uses anon key but INSERT/UPDATE/DELETE
--          were blocked by missing RLS policies for public role.
-- ============================================

-- 1. AMBASSADEURS - Add INSERT, UPDATE, DELETE for public role (anon)
CREATE POLICY "anon_insert_ambassadeurs" ON ambassadeurs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_ambassadeurs" ON ambassadeurs FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_ambassadeurs" ON ambassadeurs FOR DELETE TO public USING (true);

-- 2. AANVRAGEN - Add UPDATE and DELETE for public role
CREATE POLICY "anon_update_aanvragen" ON aanvragen FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_aanvragen" ON aanvragen FOR DELETE TO public USING (true);

-- 3. AANMELDINGEN - Add UPDATE and DELETE for public role
CREATE POLICY "anon_update_aanmeldingen" ON aanmeldingen FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_aanmeldingen" ON aanmeldingen FOR DELETE TO public USING (true);

-- 4. NIEUWS - Fix ALL policy to include with_check
DROP POLICY IF EXISTS "Allow all nieuws for anon" ON nieuws;
CREATE POLICY "anon_all_nieuws" ON nieuws FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. FINANCIEN - Create table and enable RLS
CREATE TABLE IF NOT EXISTS financien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('inkomst', 'uitgave')),
    categorie TEXT NOT NULL,
    bedrag NUMERIC(10,2) NOT NULL,
    datum DATE NOT NULL,
    omschrijving TEXT,
    jaar INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    bijlage_url TEXT,
    bijlage_naam TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_financien" ON financien FOR ALL TO public USING (true) WITH CHECK (true);
