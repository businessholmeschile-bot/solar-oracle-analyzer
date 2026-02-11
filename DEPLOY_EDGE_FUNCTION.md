# Deploy: Supabase Edge Function `save-lead`

## Requisitos
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Login a Supabase: `supabase login`

## Pasos

### 1. Vincular el proyecto
```bash
cd "/Users/drew/Desktop/Proyecto Solar Oracle"
supabase link --project-ref zqwkwnywndkwyzzggorf
```

### 2. Deploy la función
```bash
supabase functions deploy save-lead --project-ref zqwkwnywndkwyzzggorf
```

### 3. Verificar
```bash
curl -X POST https://zqwkwnywndkwyzzggorf.supabase.co/functions/v1/save-lead \
  -H "Content-Type: application/json" \
  -d '{"action": "count-leads"}'
```

Debería responder: `{"success": true, "count": N}`

## Configuración Automática
La `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` se inyectan automáticamente como variables de entorno cuando se deploya con Supabase CLI. No necesitas configurar nada manualmente.

## ⚠️ Importante
Hasta que la Edge Function esté deployada, los datos NO se guardarán en Supabase. El frontend seguirá funcionando pero en "modo offline" (sin persistencia de datos).
