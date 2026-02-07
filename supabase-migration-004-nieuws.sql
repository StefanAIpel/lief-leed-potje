-- Migration 004: Nieuws / News CMS table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nieuws (
  id SERIAL PRIMARY KEY,
  titel TEXT NOT NULL,
  samenvatting TEXT,
  inhoud TEXT NOT NULL,
  afbeelding_url TEXT,
  auteur TEXT DEFAULT 'Kerngroep',
  gepubliceerd BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anon read for published articles
ALTER TABLE nieuws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read published nieuws" ON nieuws
  FOR SELECT USING (gepubliceerd = true);

CREATE POLICY "Allow all nieuws for anon" ON nieuws
  FOR ALL USING (true);
