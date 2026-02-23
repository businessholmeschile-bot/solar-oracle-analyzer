// ============================================================
// MOTOR ORACLE IA - Edge Function: oracle-brain v3.7
// SolarOracle B2B Intelligence Engine - STABLE ECONOMY
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_EXECUTION_TIME_MS = 54000; 

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const startTime = Date.now()
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
    const GOOGLE_CSE_KEY = Deno.env.get('GOOGLE_CSE_KEY') || ''
    const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID') || ''

    let body: any = {};
    try { body = await req.json(); } catch(_) {}
    
    const { data: scanLog } = await supabase.from('oracle_scan_log').insert({ 
        scan_type: body.query ? 'TARGETED' : 'ECONOMY_GROWTH', 
        status: 'RUNNING' 
    }).select().single()
    const logId = scanLog?.id

    let totalNew = 0
    let errorMessage = null

    try {
        const query = body.query || "empresa instalacion paneles solares chile";

        console.log(`[OracleBrain] Usando Google CSE. Query: ${query}`);
        const cseUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&gl=cl`;
        const r = await fetch(cseUrl);
        const d = await r.json();

        if (d.error) {
            throw new Error(`Google CSE Error: ${d.error.message}`);
        }

        const items = d.items || [];
        console.log(`[OracleBrain] Encontrados ${items.length} resultados.`);

        for (const item of items) {
            if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) break;

            const url = item.link || item.url || '';
            const norm = url.split('?')[0].replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
            if (!norm || norm.includes('google') || norm.includes('wikipedia') || norm.includes('linkedin')) continue;

            const { data: exists } = await supabase.from('potential_b2b_leads').select('id').ilike('website', `%${norm}%`).limit(1);
            if (exists && exists.length > 0) continue;

            // IA Verification
            const prompt = `Analiza si esto es una EMPRESA de servicios solares B2B en Chile. Título: ${item.title}. Snippet: ${item.snippet}. Responde SOLAMENTE JSON: {"is_company": true, "name": "Nombre Limpio", "city": "...", "region": "..."}`;
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'application/json' } })
            });
            
            const gData = await gRes.json();
            if (gData.candidates?.[0]) {
                const analysis = JSON.parse(gData.candidates[0].content.parts[0].text);
                if (analysis.is_company && analysis.name) {
                    await supabase.from('potential_b2b_leads').insert([{
                        nombre_empresa: analysis.name,
                        website: norm,
                        ciudad: analysis.city,
                        region: analysis.region,
                        score: 75,
                        fuente_busqueda: query,
                        detectado_en: new Date().toISOString(),
                        estado: 'Nuevo'
                    }]);
                    totalNew++;
                }
            }
        }

        await supabase.from('oracle_scan_log').update({
            status: 'COMPLETED', leads_new: totalNew, duration_ms: Date.now() - startTime, finished_at: new Date().toISOString()
        }).eq('id', logId);

    } catch (e) {
        errorMessage = e.message;
        await supabase.from('oracle_scan_log').update({ 
            status: 'ERROR', 
            error_message: errorMessage,
            finished_at: new Date().toISOString()
        }).eq('id', logId);
    }

    return new Response(JSON.stringify({ success: !errorMessage, error: errorMessage, added: totalNew }), { headers: corsHeaders });
})
