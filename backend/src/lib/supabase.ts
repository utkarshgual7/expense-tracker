import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

// Service role key: server-only, bypasses RLS. Never expose this to the browser.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Shape of the expenses table as Postgres returns it. */
export type ExpenseRow = {
  id: string;
  title: string;
  amount: string; // numeric arrives as a string so precision survives the wire
  category: "food" | "travel" | "bills" | "other";
  date: string; // YYYY-MM-DD
  created_at: string;
};
