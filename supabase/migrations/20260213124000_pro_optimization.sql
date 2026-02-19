-- 1. ENABLE REALTIME for leads table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leads;
    END IF;
END $$;

-- 2. CREATE SETTINGS TABLE (Proposal 6)
create table if not exists app_settings (
    key text primary key,
    value jsonb not null,
    description text,
    updated_at timestamp with time zone default now()
);

-- Insert initial values
insert into app_settings (key, value, description)
values 
    ('solar_engine_config', '{"kwh_price": 120, "tax_benefit": 0.19, "maintenance_cost": 50000}', 'Configuración global del motor solar'),
    ('contact_info', '{"whatsapp": "+56912345678", "email": "info@solaroracle.cl"}', 'Información de contacto global')
on conflict (key) do nothing;

-- 3. ENABLE RLS for Security Level Pro (Proposal 3)
alter table leads enable row level security;

-- Policy Management
DROP POLICY IF EXISTS "Allow public lead creation" ON leads;
create policy "Allow public lead creation"
on leads for insert
with check (true);

DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
create policy "Admins can view all leads"
on leads for select
using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update leads" ON leads;
create policy "Admins can update leads"
on leads for update
using (auth.role() = 'authenticated');
