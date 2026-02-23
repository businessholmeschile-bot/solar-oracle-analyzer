import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const body = await req.json().catch(() => ({}))
        const { action, payload } = body

        // Auth
        const publicActions = ['chat-sdr', 'save-final-lead', 'chatbot-lead'];
        if (!publicActions.includes(action)) {
            if (payload?.password !== 'solar2026') {
                return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }
        }

        // ────────────────────────────────────────────────────────────────
        // GETTERS
        // ────────────────────────────────────────────────────────────────
        if (action === 'get-oracle-leads') {
            const { data, error } = await supabase.from('potential_b2b_leads').select('*').order('detectado_en', { ascending: false });
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'get-oracle-log') {
            const { data, error } = await supabase.from('oracle_scan_log').select('*').order('started_at', { ascending: false }).limit(20);
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'get-distributors') {
            const { data, error } = await supabase.from('distributors_intel').select('*').order('nombre', { ascending: true });
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ────────────────────────────────────────────────────────────────
        // ENRICH LEAD (ULTRA RELIABLE)
        // ────────────────────────────────────────────────────────────────
        if (action === 'enrich-lead') {
            let { id, url } = payload;
            const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
            const KIMI_API_KEY = Deno.env.get("KIMI_API_KEY") ?? "";
            const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
            
            if (!url) throw new Error("URL no proporcionada");
            if (!url.startsWith('http')) url = 'https://' + url;

            let html = "";
            let cleanText = "";
            try {
                const siteResp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                html = await siteResp.text();
                cleanText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                                .replace(/<[^>]*>/g, " ")
                                .replace(/\s+/g, " ")
                                .slice(0, 8000);
            } catch (e) {
                console.warn(`Error leyendo sitio ${url}:`, e.message);
            }

            const prompt = `Analiza este sitio web de Chile: ${url}. 
            Contenido: ${cleanText.slice(0, 6000)}
            
            OBJETIVO: Extraer inteligencia de negocio para ofrecerles un software de automatización de cotizaciones solares.
            
            DEVUELVE ESTRICTAMENTE UN JSON CON ESTA ESTRUCTURA (Responde SOLO el JSON):
            {
              "nombre_empresa": "Nombre real",
              "ai_summary": "Resumen ejecutivo de 2 líneas sobre qué hacen y su enfoque comercial.",
              "type": "Instalador Residencial / Industrial / EPC / Distribuidor",
              "size": "Pequeña (1-10) / Mediana (11-50) / Grande (51+)",
              "stack": ["Marca Inversores", "Marca Paneles", "Software detectable"],
              "competitor_profile": "Perfil psicográfico del dueño/vendedor (ej: Enfoque en ahorro, calidad técnica, rapidez).",
              "outreach_draft": "Mensaje de 2 párrafos para WhatsApp ofreciéndoles SolarOracle.",
              "social": {
                "linkedin": "url o null",
                "instagram": "url o null"
              },
              "contact_suggestion": {
                "email": "email encontrado",
                "phones": ["+56..."]
              },
              "region": "Región de Chile",
              "ciudad": "Ciudad",
              "score": 0-100
            }`;

            let extracted: any = null;
            let errors: string[] = [];

            // PRIORITY 1: DEEPSEEK
            if (DEEPSEEK_API_KEY && !extracted) {
                try {
                    const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
                        body: JSON.stringify({
                            model: "deepseek-chat",
                            messages: [{ role: "user", content: prompt }],
                            response_format: { type: 'json_object' }
                        })
                    });
                    if (dsRes.ok) {
                        const data = await dsRes.json();
                        extracted = JSON.parse(data.choices[0].message.content);
                    } else if (dsRes.status === 402) {
                        errors.push("DeepSeek: Sin Saldo");
                    }
                } catch (_) {}
            }

            // PRIORITY 2: GEMINI (Try multiple endpoints to avoid 404)
            if (!extracted && GEMINI_API_KEY) {
                const endpoints = [
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`
                ];

                for (const endpoint of endpoints) {
                    try {
                        const gemRes = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
                            })
                        });
                        if (gemRes.ok) {
                            const data = await gemRes.json();
                            const text = data.candidates[0].content.parts[0].text;
                            extracted = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
                            break;
                        } else {
                            errors.push(`Gemini ${endpoint.includes('v1beta') ? 'v1beta' : 'v1'} ${gemRes.status}`);
                        }
                    } catch (_) {}
                }
            }

            // PRIORITY 3: KIMI
            if (!extracted && KIMI_API_KEY) {
                try {
                    const kimiRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIMI_API_KEY}` },
                        body: JSON.stringify({ model: "moonshot-v1-8k", messages: [{ role: "user", content: prompt }] })
                    });
                    if (kimiRes.ok) {
                        const data = await kimiRes.json();
                        const match = data.choices[0].message.content.match(/\{[\s\S]*\}/);
                        if (match) extracted = JSON.parse(match[0]);
                    } else {
                        errors.push(`Kimi ${kimiRes.status}`);
                    }
                } catch (_) {}
            }

            // FINAL FALLBACK: REGEX
            if (!extracted) {
                const email = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
                const phone = html.match(/\+56\s?9\s?\d{4}\s?\d{4}|\+56\d{9}|9\d{8}/)?.[0] || null;
                const insta = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/)?.[1] || null;
                const name = url.replace(/https?:\/\/(www\.)?/, '').split('.')[0].toUpperCase();
                
                extracted = {
                    nombre_empresa: name,
                    ai_summary: "No se pudo realizar el análisis de IA por fallas en proveedores (Gemini/DeepSeek). Los datos de contacto se extrajeron mediante escaneo directo de código.",
                    type: "No clasificado",
                    size: "No identificado",
                    stack: [],
                    competitor_profile: "Solo datos de contacto directos encontrados.",
                    outreach_draft: `Hola ${name}, detectamos fallas en la interconexión de IA pero logramos llegar a su web. ¿Tienen disponibilidad para ver SolarOracle?`,
                    social: { linkedin: null, instagram: insta },
                    contact_suggestion: { email, phones: phone ? [phone] : [] },
                    region: "Chile",
                    ciudad: "Chile",
                    score: 50
                };
            }

            // Update DB
            await supabase.from('potential_b2b_leads').update({
                nombre_empresa: extracted.nombre_empresa || undefined,
                email_contacto: extracted.contact_suggestion?.email || undefined,
                telefono: extracted.contact_suggestion?.phones?.[0] || undefined,
                region: extracted.region || undefined,
                ciudad: extracted.ciudad || undefined,
                instagram: extracted.social?.instagram || undefined,
                score: extracted.score || 95,
                enrichment_data: extracted // Save full object for the UI
            }).eq('id', id);

            return new Response(JSON.stringify({ success: true, data: extracted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ────────────────────────────────────────────────────────────────
        // OTHER ACTIONS
        // ────────────────────────────────────────────────────────────────
        if (action === 'update-lead' || action === 'update-lead-status') {
             await supabase.from('potential_b2b_leads').update(payload).eq('id', payload.id);
             return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'delete-lead') {
            await supabase.from('potential_b2b_leads').delete().eq('id', payload.id);
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'chatbot-lead') {
            const { data, error } = await supabase.from('potential_b2b_leads').insert([payload]).select().single();
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, leadId: data.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'save-final-lead') {
            const { error } = await supabase.from('final_solar_leads').insert([payload]);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'chat-sdr') {
            const { history } = payload;
            const systemPrompt = "Eres un SDR senior de SolarOracle. Meta: obtener kW/mes, email y nombre empresa. Cierra con [LEAD_CERRADO].";
            // Usar Gemini con redundancia
            const endpoints = [
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`
            ];
            
            let responseText = "Lo siento, tengo un problema de conexión. Por favor reintenta en un momento.";
            for (const endpoint of endpoints) {
                try {
                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: systemPrompt + " " + JSON.stringify(history) }] }]
                        })
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        responseText = data.candidates[0].content.parts[0].text;
                        break;
                    }
                } catch (_) {}
            }
            
            return new Response(JSON.stringify({ success: true, response: responseText }), { headers: corsHeaders });
        }

        if (action === 'clear-scan-logs') {
            const { error } = await supabase.from('oracle_scan_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { status: 400, headers: corsHeaders });


    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
    }
})
