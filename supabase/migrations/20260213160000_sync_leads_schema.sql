-- Migración: Sync Schema Leads v4.5.1
-- Añadir columnas técnicas para el Analizador

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_number TEXT,
ADD COLUMN IF NOT EXISTS distribuidora TEXT,
ADD COLUMN IF NOT EXISTS ubicacion TEXT,
ADD COLUMN IF NOT EXISTS kwh_mensual TEXT,
ADD COLUMN IF NOT EXISTS costo_inaccion TEXT,
ADD COLUMN IF NOT EXISTS payback_period TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS project_id TEXT,
ADD COLUMN IF NOT EXISTS analysis_data JSONB;

-- Asegurar que la tabla es accesible por la Edge Function
GRANT ALL ON public.leads TO service_role;
