-- ============================================================
-- MOTOR ORACLE IA - Base de Datos de Inteligencia
-- SolarOracle B2B Intelligence Engine
-- Fecha: 2026-02-18
-- ============================================================

-- ============================================================
-- TABLA 1: distributors_intel
-- Almacena datos de las distribuidoras eléctricas chilenas.
-- El agente monitorea estas webs diariamente.
-- ============================================================
CREATE TABLE IF NOT EXISTS distributors_intel (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          TEXT NOT NULL UNIQUE,
    region          TEXT,
    website         TEXT,
    link_tarifas    TEXT,
    link_empalme    TEXT,
    email_soporte   TEXT,
    -- Datos de monitoreo (actualizados por el agente)
    tarifa_bt1_actual   NUMERIC(10, 4),   -- Valor CLP/kWh detectado
    tarifa_bt1_anterior NUMERIC(10, 4),   -- Valor anterior para detectar cambios
    tarifa_actualizada_en TIMESTAMPTZ,    -- Cuándo se detectó el último cambio
    ultimo_scan     TIMESTAMPTZ DEFAULT NOW(),
    status_scan     TEXT DEFAULT 'Pendiente', -- 'OK', 'Error', 'Cambio Detectado'
    notas_cambio    TEXT,                 -- Descripción del cambio detectado por IA
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Poblar con datos semilla de las distribuidoras chilenas
INSERT INTO distributors_intel (nombre, region, website, link_tarifas, link_empalme, email_soporte) VALUES
    ('ASD Energía',         'Atacama',              'https://www.asdenergía.cl',         NULL, NULL, NULL),
    ('CGE',                 'Varias Regiones',      'https://www.cge.cl',                'https://www.cge.cl/clientes/tarifas/', 'https://www.cge.cl/empresas/empalme/', 'contacto@cge.cl'),
    ('Chilquinta',          'Valparaíso',           'https://www.chilquinta.cl',          'https://www.chilquinta.cl/tarifas/', 'https://www.chilquinta.cl/empalme/', 'clientes@chilquinta.cl'),
    ('EDELAYSEN',           'Aysén',                'https://www.edelaysen.cl',           NULL, NULL, 'contacto@edelaysen.cl'),
    ('EDELMAG',             'Magallanes',           'https://www.edelmag.cl',             NULL, NULL, 'contacto@edelmag.cl'),
    ('EEPA',                'Punta Arenas',         'https://www.eepa.cl',               NULL, NULL, NULL),
    ('Enel',                'Metropolitana',        'https://www.enel.cl',               'https://www.enel.cl/es-cl/clientes/informacion-util/tarifas.html', 'https://www.enel.cl/es-cl/empresas/conexiones.html', 'atencion@enel.cl'),
    ('Enel Colina',         'Metropolitana Norte',  'https://www.enel.cl',               NULL, NULL, NULL),
    ('Energía Casablanca',  'Valparaíso',           NULL,                                NULL, NULL, NULL),
    ('Frontel',             'Araucanía / Los Ríos', 'https://www.frontel.cl',            'https://www.frontel.cl/tarifas/', NULL, 'contacto@frontel.cl'),
    ('Litoral',             'Biobío',               'https://www.litoral.cl',            NULL, NULL, NULL),
    ('Luz Linares',         'Maule',                NULL,                                NULL, NULL, NULL),
    ('Luz Osorno',          'Los Lagos',            'https://www.luzosorno.cl',          NULL, NULL, NULL),
    ('Luz Parral',          'Maule',                NULL,                                NULL, NULL, NULL),
    ('SAESA',               'Los Lagos / Sur',      'https://www.saesa.cl',              'https://www.saesa.cl/tarifas/', 'https://www.saesa.cl/empalme/', 'contacto@saesa.cl')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================
-- TABLA 2: potential_b2b_leads
-- Empresas instaladoras de paneles solares detectadas por el agente.
-- ============================================================
CREATE TABLE IF NOT EXISTS potential_b2b_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa  TEXT NOT NULL,
    website         TEXT UNIQUE,
    instagram       TEXT,
    email_contacto  TEXT,
    telefono        TEXT,
    ciudad          TEXT,
    region          TEXT,
    -- Scoring de Calidad (calculado por Gemini)
    score           INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    score_razon     TEXT,    -- Explicación del score (ej: "Tiene web, Instagram activo, menciona EPC")
    -- Keywords encontradas en su web
    keywords_found  TEXT[],  -- Array: ['EPC', 'Ingeniería', 'Net Billing']
    -- Estado del lead en el CRM
    estado          TEXT DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'Revisado', 'Contactado', 'Descartado', 'Cliente')),
    -- Metadata del agente
    fuente_busqueda TEXT,    -- Query que lo encontró (ej: "instalación solar Santiago")
    detectado_en    TIMESTAMPTZ DEFAULT NOW(),
    ultimo_contacto TIMESTAMPTZ,
    notas           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA 3: oracle_scan_log
-- Registro de cada ejecución del agente para auditoría.
-- ============================================================
CREATE TABLE IF NOT EXISTS oracle_scan_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type       TEXT NOT NULL, -- 'CRON', 'MANUAL'
    status          TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'ERROR'
    leads_found     INTEGER DEFAULT 0,
    leads_new       INTEGER DEFAULT 0,
    distributors_checked INTEGER DEFAULT 0,
    distributor_changes  INTEGER DEFAULT 0,
    error_message   TEXT,
    duration_ms     INTEGER,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    finished_at     TIMESTAMPTZ
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_b2b_leads_estado ON potential_b2b_leads(estado);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_score ON potential_b2b_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_detectado ON potential_b2b_leads(detectado_en DESC);
CREATE INDEX IF NOT EXISTS idx_dist_ultimo_scan ON distributors_intel(ultimo_scan DESC);

-- ============================================================
-- FUNCIÓN: auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_distributors_intel_updated_at
    BEFORE UPDATE ON distributors_intel
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_b2b_leads_updated_at
    BEFORE UPDATE ON potential_b2b_leads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
