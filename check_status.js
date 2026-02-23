// Node 24 has native fetch

async function checkStatus() {
  const PROXY_URL_ORACLE =
    "https://zqwkwnywndkwyzzggorf.supabase.co/functions/v1/save-lead";
  const pass = "solar2026";

  try {
    const [leadsResp, logResp] = await Promise.all([
      fetch(PROXY_URL_ORACLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-oracle-leads",
          payload: { password: pass },
        }),
      }),
      fetch(PROXY_URL_ORACLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-oracle-log",
          payload: { password: pass },
        }),
      }),
    ]);

    const leads = await leadsResp.json();
    const logs = await logResp.json();

    console.log("--- LEADS ---");
    if (leads.success) {
      const today = new Date().toISOString().split("T")[0];
      const leadsToday = leads.data.filter(
        (l) => l.detectado_en && l.detectado_en.startsWith(today),
      ).length;
      console.log(`Total Leads: ${leads.data.length}`);
      console.log(`Leads de Hoy (UTC ${today}): ${leadsToday}`);
      console.log('\n--- ÚLTIMOS 5 LEADS ---');
      leads.data.slice(0, 5).forEach(l => {
        console.log(`- ${l.detectado_en}: ${l.nombre_empresa} (${l.fuente_busqueda || 'N/A'})`);
      });
    } else {
      console.log("Error leads:", leads);
    }

    console.log("\n--- LOGS (Latest 5) ---");
    if (logs.success) {
      logs.data.slice(0, 5).forEach((l) => {
        console.log(
          `- ${l.started_at}: ${l.status} (${l.leads_new} leads nuevos, type: ${l.scan_type})`,
        );
      });
    } else {
      console.log("Error logs:", logs);
    }
  } catch (e) {
    console.error(e);
  }
}

checkStatus();
