-- ============================================================
-- Permisos RLS para tablas del Motor Oracle IA
-- Las Edge Functions usan service_role, que bypasea RLS.
-- Pero necesitamos habilitar RLS y dar acceso al service_role.
-- ============================================================

-- Habilitar RLS en las tablas Oracle
ALTER TABLE distributors_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE potential_b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_scan_log ENABLE ROW LEVEL SECURITY;

-- Política: solo el service_role (Edge Functions) puede leer/escribir
-- El anon role NO tiene acceso directo (seguridad)

CREATE POLICY "service_role_all_distributors" ON distributors_intel
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_b2b_leads" ON potential_b2b_leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_oracle_log" ON oracle_scan_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
