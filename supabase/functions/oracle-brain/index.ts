// ============================================================
// MOTOR ORACLE IA - Edge Function: oracle-brain
// SolarOracle B2B Intelligence Engine
//
// Deploy: supabase functions deploy oracle-brain --project-ref zqwkwnywndkwyzzggorf
// CRON:   Configurar en Supabase Dashboard > Edge Functions > oracle-brain > Schedule
//         Expresión: 0 8 * * *  (Todos los días a las 8 AM Chile)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
const SEARCH_QUERIES = [
    "empresa instalación paneles solares Chile",
    "instalador fotovoltaico Santiago Chile",
    "empresa solar EPC Chile",
    "instalación paneles solares Valparaíso",
    "empresa solar Concepción Chile",
    "ingeniería solar fotovoltaica Chile",
    "instalador certificado SEC paneles solares",
    "empresa energía renovable Chile PYME",
]

const B2B_KEYWORDS = ['EPC', 'ingeniería', 'cotizar', 'instalación', 'fotovoltaico', 'SEC', 'net billing', 'PMGD', 'ERNC', 'paneles solares', 'energía solar']
const HIGH_VALUE_KEYWORDS = ['EPC', 'ingeniería', 'PMGD', 'SEC', 'net billing']

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTime = Date.now()
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') ?? ''

    // Determinar si es llamada manual o CRON
    let scanType = 'CRON'
    try {
        const body = await req.json().catch(() => ({}))
        if (body?.manual === true) scanType = 'MANUAL'
    } catch (_) { /* CRON calls may have no body */ }

    // Registrar inicio del scan
    const { data: scanLog } = await supabase
        .from('oracle_scan_log')
        .insert({ scan_type: scanType, status: 'RUNNING' })
        .select()
        .single()

    const logId = scanLog?.id

    let totalLeadsFound = 0
    let totalLeadsNew = 0
    let distributorChanges = 0
    let errorMessage = null

    try {
        console.log(`[OracleBrain] Iniciando scan ${scanType}...`)

        // ============================================================
        // MODO 1: EXPLORADOR - Buscar nuevas empresas instaladoras
        // ============================================================
        console.log('[OracleBrain] Modo Explorador: Buscando leads B2B...')

        for (const query of SEARCH_QUERIES) {
            try {
                const searchResults = await searchWeb(query, SERPAPI_KEY)
                if (!searchResults || searchResults.length === 0) continue

                for (const result of searchResults) {
                    totalLeadsFound++
                    const lead = await analyzeWebsite(result, query, GEMINI_API_KEY)
                    if (!lead) continue

                    // Guardar sin duplicados (upsert por website)
                    const { error: upsertError } = await supabase
                        .from('potential_b2b_leads')
                        .upsert(lead, { onConflict: 'website', ignoreDuplicates: false })

                    if (!upsertError) totalLeadsNew++
                }

                // Pequeña pausa entre queries para no sobrecargar APIs
                await sleep(1500)

            } catch (queryError) {
                console.error(`[OracleBrain] Error en query "${query}":`, queryError)
            }
        }

        // ============================================================
        // MODO 2: ESPÍA DE DISTRIBUIDORAS - Monitorear cambios
        // ============================================================
        console.log('[OracleBrain] Modo Espía: Monitoreando distribuidoras...')

        const { data: distributors } = await supabase
            .from('distributors_intel')
            .select('*')
            .not('link_tarifas', 'is', null)

        if (distributors) {
            for (const dist of distributors) {
                try {
                    const change = await monitorDistributor(dist, GEMINI_API_KEY)

                    if (change.hasChange) {
                        distributorChanges++
                        await supabase
                            .from('distributors_intel')
                            .update({
                                tarifa_bt1_anterior: dist.tarifa_bt1_actual,
                                tarifa_bt1_actual: change.newTariff,
                                tarifa_actualizada_en: new Date().toISOString(),
                                status_scan: 'Cambio Detectado',
                                notas_cambio: change.description,
                                ultimo_scan: new Date().toISOString(),
                            })
                            .eq('id', dist.id)
                    } else {
                        await supabase
                            .from('distributors_intel')
                            .update({
                                status_scan: 'OK',
                                ultimo_scan: new Date().toISOString(),
                            })
                            .eq('id', dist.id)
                    }

                    await sleep(2000)
                } catch (distError) {
                    console.error(`[OracleBrain] Error monitoreando ${dist.nombre}:`, distError)
                    await supabase
                        .from('distributors_intel')
                        .update({ status_scan: 'Error', ultimo_scan: new Date().toISOString() })
                        .eq('id', dist.id)
                }
            }
        }

        // Actualizar log como completado
        await supabase
            .from('oracle_scan_log')
            .update({
                status: 'COMPLETED',
                leads_found: totalLeadsFound,
                leads_new: totalLeadsNew,
                distributors_checked: distributors?.length ?? 0,
                distributor_changes: distributorChanges,
                duration_ms: Date.now() - startTime,
                finished_at: new Date().toISOString(),
            })
            .eq('id', logId)

        console.log(`[OracleBrain] Scan completado. Leads: ${totalLeadsNew} nuevos. Cambios distribuidoras: ${distributorChanges}`)

        return new Response(
            JSON.stringify({
                success: true,
                summary: {
                    scan_type: scanType,
                    leads_found: totalLeadsFound,
                    leads_new: totalLeadsNew,
                    distributor_changes: distributorChanges,
                    duration_ms: Date.now() - startTime,
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (fatalError) {
        errorMessage = fatalError instanceof Error ? fatalError.message : String(fatalError)
        console.error('[OracleBrain] ERROR FATAL:', errorMessage)

        await supabase
            .from('oracle_scan_log')
            .update({
                status: 'ERROR',
                error_message: errorMessage,
                duration_ms: Date.now() - startTime,
                finished_at: new Date().toISOString(),
            })
            .eq('id', logId)

        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// ============================================================
// HELPER: Buscar en la web (SerpApi o fallback simulado)
// ============================================================
async function searchWeb(query: string, serpApiKey: string): Promise<Array<{ title: string, url: string, snippet: string }>> {
    // Si hay SerpApi key, usarla
    if (serpApiKey) {
        try {
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&location=Chile&hl=es&gl=cl&num=10&api_key=${serpApiKey}`
            const resp = await fetch(url)
            const data = await resp.json()

            return (data.organic_results || []).map((r: any) => ({
                title: r.title || '',
                url: r.link || '',
                snippet: r.snippet || '',
            }))
        } catch (e) {
            console.warn('[OracleBrain] SerpApi error, usando fallback:', e)
        }
    }

    // Fallback: Google Custom Search API (si se configura)
    const GOOGLE_CSE_KEY = Deno.env.get('GOOGLE_CSE_KEY')
    const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID')

    if (GOOGLE_CSE_KEY && GOOGLE_CSE_ID) {
        try {
            const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`
            const resp = await fetch(url)
            const data = await resp.json()

            return (data.items || []).map((r: any) => ({
                title: r.title || '',
                url: r.link || '',
                snippet: r.snippet || '',
            }))
        } catch (e) {
            console.warn('[OracleBrain] Google CSE error:', e)
        }
    }

    // Sin API keys: retornar vacío (el sistema funciona, solo no busca)
    console.warn('[OracleBrain] No hay API de búsqueda configurada. Configura SERPAPI_KEY o GOOGLE_CSE_KEY.')
    return []
}

// ============================================================
// HELPER: Analizar website con Gemini AI
// ============================================================
async function analyzeWebsite(
    result: { title: string, url: string, snippet: string },
    sourceQuery: string,
    geminiApiKey: string
): Promise<Record<string, unknown> | null> {
    if (!result.url || result.url.includes('youtube.com') || result.url.includes('facebook.com')) {
        return null
    }

    // Calcular score rápido basado en snippet (sin llamar a Gemini para ahorrar tokens)
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    const foundKeywords = B2B_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()))
    const highValueCount = HIGH_VALUE_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())).length

    // Score base
    let score = foundKeywords.length * 10
    score += highValueCount * 15
    if (result.url.includes('.cl')) score += 10 // Dominio chileno
    if (text.includes('instagram') || text.includes('contacto')) score += 5
    score = Math.min(score, 100)

    // Si el score es muy bajo, descartar sin gastar tokens de Gemini
    if (score < 20) return null

    // Usar Gemini para enriquecer datos si hay API key
    let enrichedData: Record<string, unknown> = {}
    if (geminiApiKey && score >= 40) {
        try {
            enrichedData = await enrichWithGemini(result, geminiApiKey)
        } catch (e) {
            console.warn('[OracleBrain] Gemini enrich error:', e)
        }
    }

    return {
        nombre_empresa: enrichedData.nombre_empresa || result.title,
        website: result.url,
        instagram: enrichedData.instagram || null,
        email_contacto: enrichedData.email || null,
        telefono: enrichedData.telefono || null,
        ciudad: enrichedData.ciudad || null,
        region: enrichedData.region || null,
        score: enrichedData.score || score,
        score_razon: enrichedData.score_razon || `Keywords: ${foundKeywords.join(', ')}`,
        keywords_found: foundKeywords,
        estado: 'Nuevo',
        fuente_busqueda: sourceQuery,
    }
}

// ============================================================
// HELPER: Enriquecer datos con Gemini
// ============================================================
async function enrichWithGemini(
    result: { title: string, url: string, snippet: string },
    apiKey: string
): Promise<Record<string, unknown>> {
    const prompt = `
    Analiza este resultado de búsqueda de una empresa de energía solar en Chile.
    Título: "${result.title}"
    URL: "${result.url}"
    Descripción: "${result.snippet}"
    
    Extrae y devuelve SOLO un JSON con estos campos:
    {
        "nombre_empresa": "nombre limpio de la empresa",
        "ciudad": "ciudad principal (o null)",
        "region": "región de Chile (o null)",
        "instagram": "handle de instagram si se menciona (o null)",
        "email": "email de contacto si se menciona (o null)",
        "telefono": "teléfono si se menciona (o null)",
        "score": número del 0 al 100 indicando qué tan buen lead B2B es para venderle un SaaS de análisis de boletas eléctricas,
        "score_razon": "explicación breve del score en español"
    }
    Responde SOLO el JSON, sin markdown.
    `

    const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, response_mime_type: 'application/json' }
            })
        }
    )

    const data = await resp.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())
}

// ============================================================
// HELPER: Monitorear distribuidora
// ============================================================
async function monitorDistributor(
    dist: Record<string, unknown>,
    geminiApiKey: string
): Promise<{ hasChange: boolean, newTariff: number | null, description: string }> {
    if (!dist.link_tarifas) {
        return { hasChange: false, newTariff: null, description: 'Sin link de tarifas configurado' }
    }

    try {
        // Intentar leer la página de tarifas
        const resp = await fetch(dist.link_tarifas as string, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SolarOracleBot/1.0)' },
            signal: AbortSignal.timeout(10000)
        })

        if (!resp.ok) {
            return { hasChange: false, newTariff: null, description: `HTTP ${resp.status}` }
        }

        const html = await resp.text()
        // Truncar para no exceder tokens de Gemini
        const truncated = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000)

        if (!geminiApiKey) {
            return { hasChange: false, newTariff: null, description: 'Sin Gemini API Key para análisis' }
        }

        const prompt = `
        Eres un monitor de tarifas eléctricas chilenas. Analiza este texto de la página de tarifas de ${dist.nombre}.
        Texto: "${truncated}"
        
        Extrae la tarifa BT1 (Baja Tensión residencial) en CLP/kWh.
        La tarifa anterior era: ${dist.tarifa_bt1_actual || 'desconocida'} CLP/kWh.
        
        Responde SOLO un JSON:
        {
            "tarifa_bt1": número o null,
            "hay_cambio": true/false,
            "descripcion": "descripción breve del estado o cambio detectado"
        }
        `

        const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
                })
            }
        )

        const geminiData = await geminiResp.json()
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())

        return {
            hasChange: parsed.hay_cambio === true,
            newTariff: parsed.tarifa_bt1 || null,
            description: parsed.descripcion || 'Sin cambios detectados',
        }

    } catch (e) {
        return { hasChange: false, newTariff: null, description: `Error al acceder: ${e}` }
    }
}

// ============================================================
// HELPER: Sleep
// ============================================================
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
