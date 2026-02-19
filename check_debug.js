const PROXY_URL =
  "https://zqwkwnywndkwyzzggorf.supabase.co/functions/v1/save-lead";
const PASS = "solar2026";

async function checkLogs() {
  console.log("Checking Oracle Scan Logs for today...");
  try {
    const resp = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get-oracle-log",
        payload: { password: PASS },
      }),
    });
    const result = await resp.json();

    if (result.success) {
      console.log("LOGS RETRIEVED (Last 20):");
      const logsToday = result.data.filter((log) =>
        log.started_at.includes("2026-02-19"),
      );
      if (logsToday.length === 0) {
        console.log("No logs found for 2026-02-19 in the last 20 entries.");
        console.log("Oldest log in set starts at:", result.data[result.data.length - 1]?.started_at);
      } else {
        console.log(JSON.stringify(logsToday, null, 2));
      }
    } else {
      console.error("Error:", result.error);
    }

    console.log("\nChecking Leads from today...");
    const respLeads = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get-oracle-leads",
        payload: { password: PASS },
      }),
    });
    const resultLeads = await respLeads.json();
    if (resultLeads.success) {
      const leadsToday = resultLeads.data.filter(
        (l) => l.detectado_en && l.detectado_en.includes("2026-02-19"),
      );
      console.log(`Found ${leadsToday.length} leads today.`);
      console.log(JSON.stringify(leadsToday.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error("Fatal Error:", e);
  }
}

checkLogs();
