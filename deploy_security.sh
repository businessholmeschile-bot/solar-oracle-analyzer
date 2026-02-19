#!/bin/bash

# Deploy Script for Solar Oracle Security (Supabase Edge Function)
echo "🚀 Iniciando deploy de seguridad Solar Oracle..."

# 1. Login (si no está logueado)
echo "---------------------------------------------------"
echo "PASO 1: Login en Supabase (Se abrirá tu navegador)"
echo "---------------------------------------------------"
npx supabase login

# 2. Link Project
echo "---------------------------------------------------"
echo "PASO 2: Vinculando proyecto (zqwkwnywndkwyzzggorf)"
echo "---------------------------------------------------"
npx supabase link --project-ref zqwkwnywndkwyzzggorf

# 3. Deploy Function
echo "---------------------------------------------------"
echo "PASO 3: Subiendo Función de Seguridad (save-lead)"
echo "---------------------------------------------------"
npx supabase functions deploy save-lead --project-ref zqwkwnywndkwyzzggorf --no-verify-jwt

echo "---------------------------------------------------"
echo "✅ DEPLOY COMPLETADO CON ÉXITO"
echo "---------------------------------------------------"
echo "Ahora tus claves están protegidas y los datos se guardarán."
