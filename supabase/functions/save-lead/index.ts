// Supabase Edge Function: save-lead
// Deploy: supabase functions deploy save-lead --project-ref zqwkwnywndkwyzzggorf
//
// This proxy receives lead data from the frontend and saves it to the database.
// The SUPABASE_SERVICE_ROLE_KEY is stored securely in Supabase's environment,
// never exposed to the browser.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { action, payload } = body

        // Create Supabase client with SERVICE_ROLE key (server-side only)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // --- ACTION: SAVE LEAD ---
        if (action === 'save-lead') {
            const { data, error } = await supabase
                .from('leads')
                .insert([payload])
                .select()

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, id: data?.[0]?.id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // --- ACTION: UPDATE LEAD (Ghost → Lead conversion) ---
        if (action === 'update-lead') {
            const { id, ...updateData } = payload

            if (!id) throw new Error('Missing lead ID for update')

            const { error } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', id)

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // --- ACTION: COUNT LEADS (for social proof) ---
        if (action === 'count-leads') {
            const { count, error } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, count: count || 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Unknown action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
