import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.SUPABASE_URL || "https://zqwkwnywndkwyzzggorf.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_KEY"

// To get the actual key, we will just grep it from index.ts or another file if we have it locally,
// actually the easiest way is to use the python library or supabase CLI to run a query.
