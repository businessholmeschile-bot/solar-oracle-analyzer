// Supabase Edge Function: save-lead
// Deploy: supabase functions deploy save-lead --project-ref zqwkwnywndkwyzzggorf
//
// This proxy receives lead data from the frontend and saves it to the database.
// The SUPABASE_SERVICE_ROLE_KEY is stored securely in Supabase's environment,
// never exposed to the browser.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    // Create Supabase client with SERVICE_ROLE key (server-side only)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // --- HELPER: HANDLE PDF/IMAGE UPLOAD ---
    const handleFileUpload = async (
      payload: any,
      leadId: string,
      field: string,
      bucket: string,
    ) => {
      const base64Data = payload[field];
      if (base64Data) {
        try {
          const dataPart = base64Data.split(",")[1] || base64Data;
          const binString = atob(dataPart);
          const bytes = new Uint8Array(binString.length);
          for (let i = 0; i < binString.length; i++) {
            bytes[i] = binString.charCodeAt(i);
          }

          const ext = field === "pdf_base64" ? "pdf" : "jpg";
          const fileName = `${bucket}/Lead_${leadId}_${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from(bucket).upload(fileName, bytes, {
              contentType:
                field === "pdf_base64" ? "application/pdf" : "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error(`${bucket} Upload Error:`, uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(fileName);

            if (publicUrlData) {
              if (field === "pdf_base64")
                payload.pdf_url = publicUrlData.publicUrl;
              if (field === "invoice_base64")
                payload.invoice_url = publicUrlData.publicUrl;
            }
          }
        } catch (e) {
          console.error(`Error processing ${field}:`, e);
        }
        // Cleanup big blobs
        delete payload[field];
      }
      return payload;
    };

    // --- HELPER: SEND EMAIL WITH RESEND ---
    const sendEmailWithResend = async (payload: any, pdfBase64?: string) => {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY secret");
        return;
      }

      if (payload.tipo !== "LEAD" || !payload.email) return;

      const adminEmail = "solaroracle.cl@gmail.com";
      const userName = payload.nombre || payload.name || "Cliente";
      const ubicacion = payload.ubicacion || payload.location || "Chile";

      // 1. CLIENT EMAIL (PREMIUM TEMPLATE)
      const clientSubject = `☀️ Tu Análisis Solar en ${ubicacion}: ¿Cuánto puedes ahorrar realmente?`;
      const clientHtml = `
                <div style="background-color: #f8fafc; padding: 40px 0; font-family: sans-serif;">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
                        <tr>
                            <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #064e3b 100%); padding: 40px;">
                                <img src="https://solaroracle.cl/isotipo_solaroracle_v3.png" alt="SolarOracle" style="width: 60px; height: 60px; margin-bottom: 10px;">
                                <div style="color: #bbf7d0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Intelligence System</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 20px;">Hola, ${userName} 👋</h1>
                                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                    Hemos analizado el potencial solar de tu propiedad en <strong>${ubicacion}</strong>. Este estudio revela tu camino hacia la <strong>independencia energética</strong>.
                                </p>
                                <div style="background-color: #f0fdf4; padding: 25px; border-radius: 16px; margin: 30px 0; text-align: center; border: 1px solid #dcfce7;">
                                    <div style="color: #15803d; font-size: 12px; font-weight: 800; text-transform: uppercase;">Ahorro Estimado Anual</div>
                                    <div style="color: #166534; font-size: 32px; font-weight: 900;">${payload.ahorro_anual || "Consultar"}</div>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="https://wa.me/56933519159" style="background: #10b981; color: white; padding: 18px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block;">
                                        Agendar Revisión Técnica (Gratis) 🗓️
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="background-color: #f8fafc; padding: 20px; color: #64748b; font-size: 12px;">
                                © 2026 SolarOracle Intelligence • www.solaroracle.cl
                            </td>
                        </tr>
                    </table>
                </div>
            `;

      // 2. ADMIN ALERT
      const adminSubject = `🔥 NUEVO LEAD: ${userName} (${payload.email})`;
      const adminHtml = `
                <h2>Nuevo Lead Calificado</h2>
                <p><strong>Nombre:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${payload.email}</p>
                <p><strong>Teléfono:</strong> ${payload.telefono || payload.phone || "No provisto"}</p>
                <p><strong>Ubicación:</strong> ${ubicacion}</p>
                <p><strong>Consumo:</strong> ${payload.ahorro_anual || "N/A"}</p>
                <p><strong>PDF Reporte:</strong> <a href="${payload.pdf_url}">Ver en Supabase</a></p>
                <p><strong>Boleta:</strong> <a href="${payload.invoice_url}">Ver en Supabase</a></p>
            `;

      const emails = [
        {
          from: "SolarOracle <hola@solaroracle.cl>",
          to: payload.email,
          subject: clientSubject,
          html: clientHtml,
          attachments: pdfBase64
            ? [
                {
                  filename: `Analisis_SolarOracle_${userName}.pdf`,
                  content: pdfBase64.split(",")[1] || pdfBase64,
                },
              ]
            : [],
        },
        {
          from: "SolarOracle Alert <hola@solaroracle.cl>",
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml,
        },
      ];

            // ────────────────────────────────────────────────────────────────
            // ACTION: ENRICH LEAD (DEEP SCAN)
            // ────────────────────────────────────────────────────────────────

      for (const email of emails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(email),
          });
          const resData = await res.json();
          console.log(`Email to ${email.to} status:`, res.status, resData);
        } catch (e) {
          console.error(`Error sending email to ${email.to}:`, e);
        }
      }
    };

            // ────────────────────────────────────────────────────────────────
            // ACTION: ENRICH LEAD (DEEP SCAN)
            // ────────────────────────────────────────────────────────────────
            if (action === 'enrich-lead') {
                const { id, url } = payload;
                if (!id || !url) throw new Error('Falta ID o URL');

                console.log(`[Oracle] Iniciando Deep Scan para: ${url}`);

                let enrichment: {
                    scanned_at: string;
                    status: string;
                    stack: string[];
                    type: string;
                    size: string;
                    social: { linkedin: string | null; instagram: string | null; };
                    ai_summary: string;
                    contact_suggestion?: { email?: string; phones?: { number: string; context: string }[] };
                } = {
                    scanned_at: new Date().toISOString(),
                    status: 'completed',
                    stack: [],
                    type: 'Desconocido',
                    size: 'Pyme',
                    social: { linkedin: null, instagram: null },
                    ai_summary: ''
                };

                try {
                    // Ensure protocol
                    let targetUrl = url;
                    if (!targetUrl.startsWith('http')) {
                        targetUrl = 'https://' + targetUrl;
                    }

                    // 1. Fetch HTML content (Simple Fetch)
                    // Nota: En producción idealmente usar puppeteer/browserless, aquí un simple fetch
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                    
                    const response = await fetch(targetUrl, { 
                        headers: { 
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7'
                        },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const html = await response.text();
                        const lowerHtml = html.toLowerCase();
                        const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '); // Strip vars/scripts roughly

                        // 2. Analyze Tech Stack
                        const keywords = ['huawei', 'sungrow', 'fronius', 'sma', 'victron', 'goodwe', 'trina', 'longi', 'jinko', 'canadian'];
                        enrichment.stack = keywords.filter(k => lowerHtml.includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));

                        // 3. Analyze Business Type
                        if (lowerHtml.includes('distribuidor') || lowerHtml.includes('mayorista') || lowerHtml.includes('venta de equipos')) {
                            enrichment.type = 'Distribuidor / Mayorista';
                        } else if (lowerHtml.includes('instalación') || lowerHtml.includes('proyectos') || lowerHtml.includes('llave en mano')) {
                            enrichment.type = 'Instalador EPC';
                        }

                        // 4. Analyze Size (Heuristic)
                        if (lowerHtml.includes('mw instalados') || lowerHtml.includes('grandes proyectos') || lowerHtml.includes('plantas solares')) {
                            enrichment.size = 'Empresa Grande / Utility';
                        }

                        // 5. Social Links
                        if (html.includes('linkedin.com')) enrichment.social.linkedin = 'Detectado';
                        if (html.includes('instagram.com')) enrichment.social.instagram = 'Detectado';

                        // 6. Contact Scraping (Advanced)
                        const emails = html.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g);
                        
                        // Extract phones with context (approximate lines)
                        const phoneRegex = /(?:\+?56)?(?:\s?9)\s?\d{4}\s?\d{4}/g;
                        const phoneMatches = [...cleanText.matchAll(phoneRegex)];
                        
                        const detectedPhones: { number: string; context: string }[] = [];
                        
                        phoneMatches.forEach(match => {
                            // Trim context around the match (e.g. 30 chars before and after)
                            const start = Math.max(0, match.index! - 40);
                            const end = Math.min(cleanText.length, match.index! + match[0].length + 40);
                            let context = cleanText.substring(start, end).trim();
                            // Clean context
                            context = context.replace(match[0], '').replace(/\s+/g, ' ').trim();
                            if (context.length > 50) context = context.substring(0, 50) + '...';
                            
                            // avoid duplicates
                            if (!detectedPhones.find(p => p.number === match[0])) {
                                detectedPhones.push({ number: match[0], context: context });
                            }
                        });


                        // Pick most frequent or first unique
                        const uniqueEmails = [...new Set(emails || [])].filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.js') && e.length < 50);

                        if (uniqueEmails.length > 0 || detectedPhones.length > 0) {
                             enrichment.contact_suggestion = { 
                                 email: uniqueEmails[0], 
                                 phones: detectedPhones 
                            };
                        }

                        enrichment.ai_summary = `Análisis completado. Se detectaron ${detectedPhones.length} teléfonos y ${uniqueEmails.length} emails.`;
                    } else {
                        enrichment.status = 'error';
                        enrichment.ai_summary = 'No se pudo acceder al sitio web (Error HTTP).';
                    }

                } catch (err) {
                    console.error('Deep Scan error:', err);
                    enrichment.status = 'error';
                    enrichment.ai_summary = 'Error de conexión o timeout durante el escaneo.';
                }

                // 6. Save to Database
                const { error: updateAppsError } = await supabase
                    .from('leads')
                    .update({ enrichment_data: enrichment })
                    .eq('id', id);

                if (updateAppsError) throw updateAppsError;

                return new Response(JSON.stringify({ success: true, data: enrichment }), { headers: corsHeaders });
            }

    // --- ACTION: SAVE LEAD ---
    if (action === "save-lead") {
      const tempId = "New_" + Date.now();
      const rawPdf = payload.pdf_base64;

      await handleFileUpload(payload, tempId, "pdf_base64", "proposals");
      await handleFileUpload(payload, tempId, "invoice_base64", "invoices");

      if (!payload.estado) payload.estado = "Nuevo";

      // --- DEDUPLICACIÓN ---
      // Solo para leads con número de cliente real (no GHOST ni prueba)
      const clientNum = (payload.client_number || "").trim();
      const distribuidora = (payload.distribuidora || "").trim();
      const periodo = (payload.periodo || payload.periodo_facturacion || "").trim();
      const isRealLead = clientNum && clientNum !== "9999999-K" && payload.tipo !== "GHOST";

      if (isRealLead) {
        // Buscar si ya existe una boleta con mismo número de cliente + distribuidora + período
        let dupQuery = supabase
          .from("leads")
          .select("id, created_at")
          .eq("client_number", clientNum)
          .eq("distribuidora", distribuidora);

        // Si tiene período, también lo usamos como filtro
        if (periodo) dupQuery = dupQuery.eq("periodo", periodo);

        const { data: existing } = await dupQuery.limit(1);

        if (existing && existing.length > 0) {
          // ✅ BOLETA DUPLICADA: actualizar en lugar de insertar
          const existingId = existing[0].id;
          const { data: updated, error: updateErr } = await supabase
            .from("leads")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", existingId)
            .select();

          if (updateErr) throw updateErr;

          return new Response(
            JSON.stringify({
              success: true,
              id: existingId,
              is_duplicate: true,
              message: `Boleta ya registrada (${clientNum}). Datos actualizados.`,
              data: updated?.[0] || {}
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // 🆕 BOLETA NUEVA: insertar normalmente
      const { data, error } = await supabase
        .from("leads")
        .insert([payload])
        .select();

      if (error) throw error;

      // --- SELF-LEARNING: UPDATE DISTRIBUTOR INTEL ---
      // Si la boleta trae distribuidora, actualizamos nuestra base de conocimientos
      if (distribuidora && distribuidora.length > 2) {
          try {
              // 1. Check current info
              const { data: distData } = await supabase
                  .from('distributors_intel')
                  .select('*')
                  .ilike('nombre', distribuidora) // Case insensitive match
                  .maybeSingle();

              const now = new Date().toISOString();
              // Determinar si actualizamos tarifa (solo si viene en payload)
              const tariff = payload.precio_kwh || payload.tarifa_bt1 || null; 

              if (distData) {
                  // UPDATE existing
                  await supabase.from('distributors_intel').update({
                      ultimo_scan: now,
                      status_scan: 'OK',
                      // Solo actualizamos tarifa si es distinta y válida
                      ...(tariff ? { tarifa_bt1_actual: tariff } : {})
                  }).eq('id', distData.id);
              } else {
                  // INSERT new distributor discovery
                  await supabase.from('distributors_intel').insert({
                      nombre: distribuidora,
                      ultimo_scan: now,
                      status_scan: 'OK',
                      tarifa_bt1_actual: tariff || '0',
                      region: payload.ubicacion || payload.ciudad || 'Desconocida'
                  });
              }
          } catch (err) {
              console.error("Error updating distributor intel:", err);
              // Non-blocking error
          }
      }

      if (data?.[0]?.tipo === "LEAD")
        await sendEmailWithResend(data[0], rawPdf);

      return new Response(
        JSON.stringify({ success: true, id: data?.[0]?.id, is_duplicate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- ACTION: UPDATE LEAD (Ghost → Lead conversion OR Status change) ---
    if (action === "update-lead") {
      const { id, ...updateData } = payload;

      if (!id) throw new Error("Missing lead ID for update");

      // Handle file uploads if present in update
      await handleFileUpload(updateData, id, "pdf_base64", "proposals");
      await handleFileUpload(updateData, id, "invoice_base64", "invoices");

      const { data, error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) throw error;

      // Trigger Email ONLY if converting to LEAD and has email
      if (data?.[0]?.tipo === "LEAD" && updateData.tipo === "LEAD") {
        await sendEmailWithResend(data[0]);
      }

      return new Response(
        JSON.stringify({ success: true, data: data?.[0] || {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- ACTION: GET ALL LEADS (Admin Protected) ---
    if (action === "get-leads") {
      const { password, empresa_id } = payload || {};
      const normalizedPass = (password || "").trim().toLowerCase();

      // Master passwords
      const VALID_PASSWORDS = ["solar2026", "solaroracle", "solar2025"];

      if (!VALID_PASSWORDS.includes(normalizedPass)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      // Foundation for multi-tenancy: filter if requested
      if (empresa_id) {
        query = query.eq("empresa_id", empresa_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ACTION: GET COMPANY CONFIG (Point 2, 4, 7) ---
    if (action === "get-company") {
      const { id } = payload || {};
      if (!id) throw new Error("Missing company ID");

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        // Fallback to default if not found
        return new Response(
          JSON.stringify({ success: false, error: "Not found" }),
          { headers: corsHeaders },
        );
      }

      return new Response(JSON.stringify({ success: true, company: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ACTION: UPDATE SETTINGS (Point 2, 4) ---
    if (action === "update-settings") {
      const { password, id, ...updateData } = payload || {};
      const normalizedPass = (password || "").trim().toLowerCase();
      const VALID_PASSWORDS = ["solar2026", "solaroracle", "solar2025"];

      if (!VALID_PASSWORDS.includes(normalizedPass)) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!id) throw new Error("Missing company ID for update");

      const { data, error } = await supabase
        .from("empresas")
        .upsert({ id, ...updateData })
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, company: data?.[0] || {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

        // --- ACTION: GET ORACLE B2B LEADS ---
        if (action === 'get-oracle-leads') {
            const { password } = payload || {}
            const normalizedPass = (password || '').trim().toLowerCase()
            if (!['solar2026', 'solaroracle', 'solar2025'].includes(normalizedPass)) {
                return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabase.from('potential_b2b_leads').select('*').order('score', { ascending: false }).limit(200)
            if (error) throw error
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- ACTION: GET DISTRIBUTORS INTEL ---
        if (action === 'get-distributors') {
            const { password } = payload || {}
            const normalizedPass = (password || '').trim().toLowerCase()
            if (!['solar2026', 'solaroracle', 'solar2025'].includes(normalizedPass)) {
                return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Obtener distribuidoras
            const { data: distributors, error } = await supabase
                .from('distributors_intel')
                .select('*')
                .order('nombre', { ascending: true })
            if (error) throw error

            // Cruzar con tabla leads: contar boletas reconocidas por distribuidora
            // El campo correcto es 'distribuidora' (en minúsculas en la DB)
            const { data: leadsData } = await supabase
                .from('leads')
                .select('distribuidora')

            // Construir mapa: nombre_normalizado -> count
            const boletasMap: Record<string, number> = {}
            if (leadsData) {
                leadsData.forEach((lead: any) => {
                    const raw = (lead.distribuidora || '').toLowerCase().trim()
                    if (raw && raw !== 'other') boletasMap[raw] = (boletasMap[raw] || 0) + 1
                })
            }

            // Enriquecer cada distribuidora con su conteo de boletas
            const enriched = (distributors || []).map((d: any) => {
                const nombreNorm = (d.nombre || '').toLowerCase()
                // Buscar coincidencia parcial case-insensitive
                let count = 0
                Object.entries(boletasMap).forEach(([key, val]) => {
                    if (nombreNorm.includes(key) || key.includes(nombreNorm)) count += val
                })
                return { ...d, boletas_count: count }
            })

            return new Response(JSON.stringify({ success: true, data: enriched }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- ACTION: GET ORACLE SCAN LOG ---
        if (action === 'get-oracle-log') {
            const { password } = payload || {}
            const normalizedPass = (password || '').trim().toLowerCase()
            if (!['solar2026', 'solaroracle', 'solar2025'].includes(normalizedPass)) {
                return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabase.from('oracle_scan_log').select('*').order('started_at', { ascending: false }).limit(20)
            if (error) throw error
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

    // --- ACTION: ANALYZE BILL (GEMINI AI VISUAL INTELLIGENCE) ---
    if (action === "analyze-bill") {
      const { imageBase64, mimeType } = payload || {};

      if (!imageBase64) throw new Error("Missing image data");

      // 1. Get Key (User provided or Env)
      // Ideally: Deno.env.get('GEMINI_API_KEY')
      // Key is stored securely in Supabase Secrets (never exposed to browser).
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

      // 2. Prepare Gemini 1.5 Flash Request
      // We ask for JSON output specifically.
      const prompt = `
            You are an expert energy auditor designed to read Chilean electricity bills (Boletas de Luz).
            Analyze the provided image and extract the following data in strict JSON format:
            {
                "distributor": "provider name (e.g. CGE, Enel, Chilquinta, Saesa, Frontel)",
                "clientNumber": "client/customer number (N° Cliente)",
                "consumption": number (monthly consumption in kWh, usually 'Consumo del mes' or 'Energía base'),
                "totalAmount": number (total to pay in CLP),
                "address": "service address (Dirección de Suministro)",
                "issueDate": "date of issue (Fecha de Emisión)",
                "limitDate": "payment due date (Vencimiento)"
            }
            If a value is not found, use null.
            Return ONLY the JSON string, no markdown.
            `;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: imageBase64, // Base64 string without header
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temp for factual extraction
          response_mime_type: "application/json",
        },
      };

      // 3. Call Google Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        console.error("Gemini API Error:", errText);
        throw new Error(`Gemini AI Error: ${geminiResp.status}`);
      }

      const geminiResult = await geminiResp.json();

      // 4. Parse Response
      // Gemini returns candidates[0].content.parts[0].text
      try {
        const textResponse =
          geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Empty response from AI");

        // Cleanup JSON if needed (sometimes sends markdown ```json ... ```)
        const cleanJson = textResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const analysisData = JSON.parse(cleanJson);

        // Start saving a ghost lead immediately to capture the data?
        // For now just return the analysis to the frontend.

        return new Response(
          JSON.stringify({ success: true, data: analysisData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (parseError) {
        console.error("Gemini Parse Error:", parseError);
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
