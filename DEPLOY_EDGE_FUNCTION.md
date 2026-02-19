# Guía Paso a Paso: Deploy en Supabase

Para que el sistema funcione y guarde los datos, debes subir la "Edge Function" a Supabase.
Sigue estos pasos en tu terminal (dentro de la carpeta del proyecto):

## 1. Login en Supabase
Esto abrirá tu navegador para confirmar tu cuenta.
```bash
npx supabase login
```

## 2. Vincular el Proyecto
Conecta tu carpeta local con tu proyecto en la nube.
```bash
npx supabase link --project-ref zqwkwnywndkwyzzggorf
```
*(Si te pide contraseña de base de datos y no la sabes, puedes intentar omitirla o resetearla en el panel de Supabase. Para deployar funciones a veces no es estricta).*

## 3. Subir la Función (Deploy)
Esto sube el código que protege tus claves.
```bash
npx supabase functions deploy save-lead --project-ref zqwkwnywndkwyzzggorf
```

## 4. Verificar
Prueba que todo funcione:
```bash
curl -X POST https://zqwkwnywndkwyzzggorf.supabase.co/functions/v1/save-lead \
  -H "Content-Type: application/json" \
  -d '{"action": "count-leads"}'
```
Deberías ver una respuesta como: `{"success":true,"count":...}`

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
