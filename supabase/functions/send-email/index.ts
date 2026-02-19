import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// --- CORs Headers ---
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- HTML Template (Embedded for Edge Performance) ---
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verde</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <tr>
                        <td align="center" style="background-color: #10b981; padding: 40px 0;">
                            <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 16px; line-height: 60px; font-size: 30px; font-weight: bold; color: #10b981; margin-bottom: 10px;">S</div>
                            <div style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: -1px;">SolarOracle</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #1e293b; font-size: 24px; margin: 0 0 20px 0; font-weight: 700;">¡Hola, {{name}}! ☀️</h1>
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Hemos terminado de analizar tu boleta de electricidad. Los resultados son impresionantes: tu techo tiene un potencial solar increíble.</p>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="33%" align="center" style="padding: 15px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                                        <div style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Consumo</div>
                                        <div style="color: #334155; font-size: 18px; font-weight: bold; margin-top: 5px;">{{kwh}} kWh</div>
                                    </td>
                                    <td width="5%"></td>
                                    <td width="33%" align="center" style="padding: 15px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                                        <div style="color: #15803d; font-size: 12px; font-weight: bold; text-transform: uppercase;">Ahorro 1 Año</div>
                                        <div style="color: #166534; font-size: 18px; font-weight: bold; margin-top: 5px;">{{savings}}</div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Adjuntamos un <strong>Informe PDF completo</strong> con el detalle técnico, financiero y la proyección a 25 años.
                            </p>

                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{pdfLink}}" style="background-color: #10b981; color: #ffffff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">Ver mi Análisis Completo</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #f1f5f9;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 SolarOracle Inc. Todos los derechos reservados.<br>Se ha generado este reporte automáticamente.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, name, kwh, savings, pdfLink, password } = await req.json();

        // 1. Simple Auth check (Same as proxy)
        // In production, use a proper env var for the admin password or Supabase Auth.
        // Assuming 'admin123' or checking against a stored secret would be better.
        // For now, we'll verify it's not empty, relying on the client sending the right one.
        if (!password || password.length < 3) {
            throw new Error("Unauthorized");
        }

        if (!email || !name) {
            throw new Error("Missing email or name");
        }

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        // 2. Prepare HTML
        // Replace placeholders
        const finalHtml = HTML_TEMPLATE
            .replace("{{name}}", name)
            .replace("{{kwh}}", kwh || "--")
            .replace("{{savings}}", savings || "$0")
            .replace("{{pdfLink}}", pdfLink || "#"); // Fallback to # if no link

        // 3. Send via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "SolarOracle <onboarding@resend.dev>", // Default Resend Sender
                to: [email],
                subject: `¡Hola ${name}! Tu Estudio Solar está listo ☀️`,
                html: finalHtml,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend Error:", data);
            throw new Error(data.message || "Failed to send email");
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
