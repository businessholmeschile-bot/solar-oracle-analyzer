-- 1. Create EMPRESAS table for Multi-tenancy & White-label
create table if not exists empresas (
    id text primary key, -- e.g., 'solarchile'
    nombre text not null,
    logo_url text,
    whatsapp_template text default 'Hola {{nombre}}, vi que podrías ahorrar {{ahorro}} con SolarOracle...',
    config jsonb default '{"kwh_price": 120}'::jsonb,
    created_at timestamp with time zone default now()
);

-- 2. Update LEADS table
alter table leads add column if not exists empresa_id text references empresas(id);
alter table leads add column if not exists estado text default 'Nuevo';

-- 3. Insert default company for the USER
insert into empresas (id, nombre, whatsapp_template)
values ('solaroracle-cl', 'SolarOracle Chile', 'Hola {{nombre}}, soy de SolarOracle. Tu análisis ya está listo. ¡Tu ahorro estimado es de {{ahorro}}! ¿Agendamos una breve llamada?')
on conflict (id) do nothing;
