-- Migration 003: Fix RLS policies for ambassadeurs table
-- Allow anon key to insert/update/delete ambassadeurs (admin panel uses anon key)
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow read ambassadeurs" ON ambassadeurs;
DROP POLICY IF EXISTS "Allow insert ambassadeurs" ON ambassadeurs;
DROP POLICY IF EXISTS "Allow update ambassadeurs" ON ambassadeurs;
DROP POLICY IF EXISTS "Allow delete ambassadeurs" ON ambassadeurs;

-- Create permissive policies (the admin PIN protects the UI, not RLS)
CREATE POLICY "Allow read ambassadeurs" ON ambassadeurs FOR SELECT USING (true);
CREATE POLICY "Allow insert ambassadeurs" ON ambassadeurs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update ambassadeurs" ON ambassadeurs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete ambassadeurs" ON ambassadeurs FOR DELETE USING (true);

-- Also add Purmer to ambassadeurs (in case the admin UI still can't insert)
INSERT INTO ambassadeurs (naam, straat, actief) 
VALUES ('Stefan Dijkstra', 'Purmer', true)
ON CONFLICT DO NOTHING;
