-- Migration 001: Fix RLS policies + add email column to aanvragen
-- Run this in Supabase SQL Editor

-- 1. Add email column to aanvragen table
ALTER TABLE aanvragen ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Add read policies for admin (via anon key - temporary until proper auth)
-- Note: This allows public read access. For production, use service key or auth.

-- Aanvragen: public read (for admin dashboard)
CREATE POLICY "Public can read aanvragen" ON aanvragen
    FOR SELECT USING (true);

-- Aanvragen: public update (for status changes)
CREATE POLICY "Public can update aanvragen" ON aanvragen
    FOR UPDATE USING (true);

-- Aanmeldingen: public read
CREATE POLICY "Public can read aanmeldingen" ON aanmeldingen
    FOR SELECT USING (true);

-- Aanmeldingen: public update (for status changes)
CREATE POLICY "Public can update aanmeldingen" ON aanmeldingen
    FOR UPDATE USING (true);

-- Ambassadeurs: full CRUD for admin
CREATE POLICY "Public can read all ambassadeurs" ON ambassadeurs
    FOR SELECT USING (true);

CREATE POLICY "Public can insert ambassadeurs" ON ambassadeurs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update ambassadeurs" ON ambassadeurs
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete ambassadeurs" ON ambassadeurs
    FOR DELETE USING (true);

-- Contactberichten: public read
CREATE POLICY "Public can read contactberichten" ON contactberichten
    FOR SELECT USING (true);

-- ⚠️ SECURITY NOTE: These policies allow public read/write access.
-- For production, replace with proper authentication (Supabase Auth or service key).
-- The PIN-protected admin page provides client-side security only.
