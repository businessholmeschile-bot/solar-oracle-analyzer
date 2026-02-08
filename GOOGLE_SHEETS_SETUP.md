# Configuración de Google Sheets para SolarOracle

## Paso 1: Crear Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala: **"SolarOracle - Leads"**

## Paso 2: Configurar Apps Script

1. En tu Google Sheet, ve a **Extensions** > **Apps Script**
2. Borra el código que aparece por defecto
3. Copia y pega el código del archivo `google-sheets-script.js`
4. Haz clic en **💾 Guardar** (o Ctrl/Cmd + S)

## Paso 3: Desplegar como Web App

1. En Apps Script, haz clic en **Deploy** > **New deployment**
2. Haz clic en el ícono de ⚙️ junto a "Select type"
3. Selecciona **Web app**
4. Configura:
   - **Description**: SolarOracle Lead Capture
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Haz clic en **Deploy**
6. **Autoriza** la aplicación (te pedirá permisos)
7. **Copia la URL** que te da (algo como: `https://script.google.com/macros/s/...`)

## Paso 4: Actualizar el Analizador

1. Abre `solar-oracle-analyzer.html`
2. Busca la línea (aproximadamente línea 980):
   ```javascript
   const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Reemplázala con tu URL:
   ```javascript
   const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';
   ```
4. Guarda el archivo

## Paso 5: Subir a GitHub

```bash
cd "/Users/drew/Desktop/Proyecto Solar Oracle"
git add .
git commit -m "Add lead capture with PDF download"
git push origin main
```

## ✅ Verificación

1. Espera 1-2 minutos para que GitHub Pages se actualice
2. Prueba el analizador en Carrd
3. Completa un análisis y descarga el PDF
4. Verifica que el email aparezca en tu Google Sheet

## 📊 Estructura del Google Sheet

Tu hoja tendrá estas columnas automáticamente:
- **Timestamp**: Fecha y hora del lead
- **Email**: Email del usuario
- **Nombre**: Nombre (si lo proporcionó)
- **N° Cliente**: Número generado en el análisis
- **Consumo (kWh)**: Consumo mensual detectado
- **Ahorro Anual**: Ahorro proyectado a 1 año

## 🔒 Seguridad

- Los datos se envían de forma segura vía HTTPS
- Solo tú tienes acceso al Google Sheet
- El script solo acepta datos POST, no GET
