# Actualización de Google Sheets - Captura Extendida + Drive

## 🎯 Cambios Implementados

### Frontend (HTML)
✅ Campo de teléfono agregado al formulario
✅ Captura de archivo convertido a Base64
✅ Envío de 26 campos de datos (vs. 6 anteriores)
✅ Información del navegador y dispositivo

### Backend (Google Apps Script)
✅ Recepción de todos los datos extendidos
✅ Almacenamiento automático de boletas en Google Drive
✅ Organización por carpetas: `SolarOracle - Boletas/YYYY-MM/`
✅ Link directo a cada boleta en el Google Sheet

---

## 📊 Datos Capturados (26 campos)

### Contacto (3)
1. Email
2. Nombre
3. **NUEVO:** Teléfono

### Análisis (13)
4. Timestamp
5. N° Cliente
6. Consumo (kWh)
7. **NUEVO:** Tarifa Actual ($/kWh)
8. **NUEVO:** Costo Actual ($)
9. **NUEVO:** Costo Proyectado ($)
10. **NUEVO:** Aumento Mensual ($)
11. **NUEVO:** Ahorro Mensual ($)
12. **NUEVO:** Ahorro 6 meses ($)
13. Ahorro 1 año ($)
14. **NUEVO:** Ahorro 2 años ($)
15. **NUEVO:** Ahorro 3 años ($)
16. **NUEVO:** Ahorro 5 años ($)

### Archivo (4)
17. **NUEVO:** Nombre Archivo
18. **NUEVO:** Tipo Archivo
19. **NUEVO:** Tamaño Archivo
20. **NUEVO:** Link Drive

### Navegador/Dispositivo (6)
21. **NUEVO:** User Agent
22. **NUEVO:** Idioma
23. **NUEVO:** Zona Horaria
24. **NUEVO:** Resolución
25. **NUEVO:** Referrer
26. **NUEVO:** URL Origen

---

## 🔄 Pasos para Actualizar

### 1. Actualizar Google Apps Script

1. Abre tu Google Sheet de SolarOracle
2. Ve a **Extensions** > **Apps Script**
3. **Borra todo** el código anterior
4. **Copia y pega** el código del archivo `google-sheets-script.js`
5. Haz clic en **💾 Guardar**
6. Haz clic en **Deploy** > **Manage deployments**
7. Haz clic en el ícono de **✏️ editar** (lápiz)
8. Cambia **Version** a "New version"
9. Haz clic en **Deploy**
10. **Copia la nueva URL** (debería ser la misma)

### 2. Verificar URL en el Analizador

La URL ya está configurada en el HTML:
```javascript
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwv4M-K3JCTdt4vkNhAZtj4-7TgyG_mJ82XGwoyhsNmYN0kqJdOGU0dFZCvdJDNAQ/exec';
```

Si la URL cambió, actualízala en la línea ~980 del HTML.

### 3. Subir Cambios a GitHub

```bash
cd "/Users/drew/Desktop/Proyecto Solar Oracle"
git add -A
git commit -m "Add extended data capture and Drive storage"
git push origin main
```

### 4. Actualizar en holmestest.xyz

Sube el nuevo archivo HTML a tu hosting.

---

## 📁 Estructura de Google Drive

Los archivos se guardarán automáticamente en:

```
Google Drive/
└── SolarOracle - Boletas/
    ├── 2026-02/
    │   ├── test_example_com_1739123456789.pdf
    │   └── juan_perez_gmail_com_1739234567890.pdf
    ├── 2026-03/
    │   └── ...
    └── ...
```

**Formato del nombre:**
`{email_sanitizado}_{timestamp}.{extension}`

---

## ✅ Verificación

1. **Espera 1-2 minutos** después de hacer deploy
2. **Prueba el analizador** en holmestest.xyz
3. **Sube una boleta** de prueba
4. **Completa el formulario** con email, nombre y teléfono
5. **Verifica:**
   - ✅ PDF se descarga
   - ✅ Fila nueva en Google Sheet con 26 columnas
   - ✅ Carpeta creada en Drive
   - ✅ Archivo subido a Drive
   - ✅ Link en la columna "Link Drive"

---

## 🎯 Beneficios

### Para Marketing
- **Teléfono** para llamadas directas
- **User Agent** para saber qué dispositivos usan
- **Referrer** para tracking de fuentes
- **Resolución** para optimizar diseño

### Para Ventas
- **Todos los datos** del análisis en un solo lugar
- **Ahorro proyectado** a múltiples plazos
- **Boleta original** disponible para verificación
- **Contexto completo** del lead

### Para Análisis
- **26 campos** de datos por lead
- **Organización automática** por mes
- **Fácil exportación** a CRM
- **Dashboard** listo para Data Studio

---

## 🚨 Importante

- Los archivos grandes (>10MB) pueden fallar
- El límite de Google Apps Script es 50MB por ejecución
- Los archivos se guardan en tu Google Drive personal
- Puedes cambiar permisos de archivos en el script (línea 127)

---

## 💡 Próximos Pasos Opcionales

1. **Email automático** al lead con el PDF
2. **Webhook a CRM** (HubSpot, Salesforce)
3. **Dashboard en Data Studio** conectado al Sheet
4. **Alertas** cuando llega un lead de alto valor
