# SolarOracle | Metodología "Diseño Green" & Matriz de Proyecto

Este documento es la fuente oficial de nombres y versiones para evitar confusiones técnicas y de diseño. Todo el ecosistema utiliza el **"Diseño Green"** (Estética limpia, blanco menta y acentos esmeralda).

---

## 🟢 ESTÉTICA GENERAL: "DISEÑO GREEN"
*   **Fondo:** Light Mint / Slate-50 (#f3fcf8 / #f8fafc).
*   **Acentos:** Emerald-500 (#10b981).
*   **Tipografía:** Outfit / Inter.

---

## 1️⃣ COMPONENTE: LANDING PAGE (Página de Inicio)
**Archivo:** `landing_page_proposal.html`
**Descripción:** La cara comercial del proyecto.
*   **Versión Actual:** `v1.0 - Diseño Green`.
*   **Estado:** Activa.

---

## 2️⃣ COMPONENTE: SOLAR ANALYZER (La Herramienta)
**Archivo:** `solar-oracle-analyzer.html`
**Descripción:** Aplicación donde el cliente sube su boleta.

### 2.a Sub-Componente: PANEL DE RESULTADOS (Dash-User)
**Descripción:** Es el "Dashboard Básico" que ve el **usuario final** inmediatamente después del análisis.
*   **Ubicación:** Sección `#results-section` dentro del Analyzer.
*   **Funcionalidad:** Muestra KPIs de ahorro, gráfico de barras "Rendimiento Solar" y el informe preliminar antes del PDF.
*   **Estilo:** `Diseño Green - Compact`.

---

## 3️⃣ COMPONENTE: ADMIN DASHBOARD (Panel Interno)
**Archivo:** `admin_dashboard_v2_fase4_refined.html`
**Descripción:** Panel de gestión para el administrador (No visible para el público).

### 3.a Versiones de Control:
| Nombre | Archivo | Descripción |
| :--- | :--- | :--- |
| **Admin Green (v2)** | `admin.html` | **VERSIÓN OFICIAL.** Gestión de leads, badges "Whale" y métricas de conversión. |
| **Admin Legacy** | `admin_dashboard.html` | Versión v1.0, diseño antiguo (No usar). |
| **Admin Imperial** | *Archivada* | Propuesta en modo oscuro (Descartada). |

---

## 4️⃣ COMPONENTE: GENERADOR DE PDF (Reporte Técnico)
**Descripción:** El documento que se descarga y se envía por correo.
*   **Versión Actual:** `Reporte Pro v4.3`.
*   **Estilo:** Adaptado para impresión, mantiene logotipos y acentos del "Diseño Green".

---

## ⚡ MÓDULO DE OPTIMIZACIÓN SUPABASE (Fase Pro)
Implementaciones de alta eficiencia para maximizar el Free Tier:

*   **P1. Live Dashboard (Realtime):** Sincronización inmediata entre el Analyzer y el Admin sin refrescar.
*   **P3. Security Level Pro (Auth/RLS):** Acceso restringido por roles y políticas de seguridad a nivel de base de datos.
*   **P5. Fast Webhooks:** Ejecución asíncrona de correos para acelerar la respuesta al usuario final.
*   **P6. Multi-Vercel Sync:** Tabla `app_settings` para centralizar precios de kWh y variables críticas en todo el ecosistema.

---

## 💎 MÓDULO SAAS & B2B (Fase Monetización)
Implementación core para el escalamiento comercial:

*   **S1. Multi-tenencia:** Tabla `empresas` para aislar datos. Los leads se etiquetan automáticamente con `empresa_id`.
*   **S2. White-Label Engine:** Soporte para logos y nombres dinámicos vía parámetros URL (`?ref=ID`).
*   **S3. Plan Maestro SaaS:** Tablero Kanban de 30 puntos integrado en Admin para ejecución estratégica.
*   **S4. Lead Workflow 2.0:** Gestión de estados (Nuevo → Logrado) y WhatsApp Bridge profesional.
*   **S5. Pricing Configurator:** Panel de control de tarifas kWh y branding por empresa.

---
*Última actualización de nomenclatura: 13 Feb 2026 - Fase SaaS & Plan Maestro*

---

## 🚀 ROADMAP DE EVOLUCIÓN (20 Propuestas)
Estas propuestas están habilitadas en la pestaña **Matrix** del Admin Dashboard para seguimiento y notas.

### 🟢 Analizador & OCR
1.  **Asistente Solar:** Onboarding guiado paso a paso.
2.  **Cámara Live:** Guía de encuadre para móviles.
3.  **Auto-Distribuidora:** Detección automática de Enel/CGE.
4.  **Multi-Mes:** Análisis de gráfica de consumo histórico.
5.  **Smart Preview:** Tabla de edición antes del PDF.

### 🟡 Análisis Avanzado
6.  **Google Maps API:** Cálculo satelital de área y sombra.
7.  **Baterías:** Simulador de almacenamiento (Powerwall).
8.  **Subsidios:** Alerta automática de fondos estatales.
9.  **Net Billing:** Desglose ahorro vs inyección.
10. **Payback:** Gráfico interactivo de retorno de inversión.

### 🔴 Conversión & Ventas
11. **WhatsApp Bridge:** Envío automático de PDF por chat.
12. **Drip Campaign:** Email marketing de seguimiento.
13. **Agendamiento:** Integración con Calendly para visitas.
14. **Lead Scoring:** Clasificación automática de leads.
15. **Smart Alerts:** Notificaciones en Slack/Telegram.

### 🔵 Ecosistema & Escalabilidad
16. **Portal Cliente:** Área personal "Mi Cuenta".
17. **Partners API:** Versión Marca Blanca para instaladores.
18. **Multi-Región:** Soporte para México, Colombia y España.
19. **Propuesta Formal:** Generador de cotización comercial.
20. **IA Chatbot:** Agente de consultoría técnica solar.
