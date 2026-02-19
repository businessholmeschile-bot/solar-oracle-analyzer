
-- ============================================================
-- SETUP CRON FOR ORACLE BRAIN (Todos los días a las 8 AM Chile)
-- ============================================================

-- 1. Habilitar extensión (si no está)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Registrar el job
-- Nota: Supabase usa el puerto 5432 localmente para los cron jobs.
-- El link es la URL de tu Edge Function.
SELECT cron.schedule(
    'oracle-brain-daily-8am',
    '0 11 * * *', -- 11:00 UTC es 08:00 AM en Chile (Invierno)
    $$
    SELECT
      net.http_post(
        url:='https://zqwkwnywndkwyzzggorf.supabase.co/functions/v1/oracle-brain',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{"manual": false}'::jsonb
      ) as request_id;
    $$
);

-- INSTRUCCIÓN ALTERNATIVA (Recomendada por Simplicidad):
-- Ve a tu Dashboard de Supabase > Edge Functions > oracle-brain > Scheduling (si tienes plan Pro)
-- O usa GitHub Actions para pegarle a la URL cada mañana.
