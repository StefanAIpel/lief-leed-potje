-- Straatambassadeurs Vathorst & Hooglanderveen
-- Database Schema voor Supabase

-- Ambassadeurs tabel
CREATE TABLE IF NOT EXISTS ambassadeurs (
    id BIGSERIAL PRIMARY KEY,
    naam VARCHAR(255) NOT NULL,
    straat VARCHAR(255),
    telefoon VARCHAR(50),
    email VARCHAR(255),
    actief BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aanmeldingen nieuwe ambassadeurs
CREATE TABLE IF NOT EXISTS aanmeldingen (
    id BIGSERIAL PRIMARY KEY,
    naam VARCHAR(255) NOT NULL,
    straat VARCHAR(255) NOT NULL,
    telefoon VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    groepsapp BOOLEAN DEFAULT true,
    bron TEXT,
    motivatie TEXT,
    status VARCHAR(50) DEFAULT 'nieuw',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lief & Leed potje aanvragen
CREATE TABLE IF NOT EXISTS aanvragen (
    id BIGSERIAL PRIMARY KEY,
    ambassadeur_id BIGINT REFERENCES ambassadeurs(id),
    ambassadeur_naam VARCHAR(255),
    straat VARCHAR(255),
    telefoon VARCHAR(50),
    email VARCHAR(255),
    
    -- Eerder ontvangen
    eerder_ontvangen BOOLEAN DEFAULT false,
    eerder_maand VARCHAR(20),
    eerder_jaar VARCHAR(10),
    vorig_gebruik TEXT,
    
    -- Administratie
    administratie VARCHAR(50), -- 'zelf' of 'kerngroep'
    
    -- Ervaring en doel
    ervaring TEXT,
    doel TEXT NOT NULL,
    
    -- Betaalgegevens
    iban VARCHAR(50),
    tenaamstelling VARCHAR(255),
    
    -- Verklaring
    verklaring_akkoord BOOLEAN DEFAULT false,
    
    -- Bedrag en status
    bedrag DECIMAL(10,2) DEFAULT 100.00,
    status VARCHAR(50) DEFAULT 'nieuw',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contactberichten
CREATE TABLE IF NOT EXISTS contactberichten (
    id BIGSERIAL PRIMARY KEY,
    naam VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    onderwerp VARCHAR(100),
    bericht TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ambassadeurs_actief ON ambassadeurs(actief);
CREATE INDEX IF NOT EXISTS idx_aanvragen_status ON aanvragen(status);
CREATE INDEX IF NOT EXISTS idx_aanmeldingen_status ON aanmeldingen(status);

-- RLS Policies (voor Supabase)
ALTER TABLE ambassadeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aanmeldingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE aanvragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactberichten ENABLE ROW LEVEL SECURITY;

-- Public read voor ambassadeurs (alleen actieve)
CREATE POLICY "Public can read active ambassadeurs" ON ambassadeurs
    FOR SELECT USING (actief = true);

-- Public can insert aanmeldingen en aanvragen
CREATE POLICY "Public can insert aanmeldingen" ON aanmeldingen
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert aanvragen" ON aanvragen
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert contactberichten" ON contactberichten
    FOR INSERT WITH CHECK (true);

-- Service role heeft volledige toegang (voor admin)
-- Dit wordt automatisch afgehandeld door Supabase service key
