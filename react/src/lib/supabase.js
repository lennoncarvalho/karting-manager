import { createClient } from "@supabase/supabase-js";

// All values are read from Vite env (`react/.env`). No in-code fallbacks:
// missing values must fail loudly rather than silently ship a hardcoded
// production secret.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in react/.env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const APP_URL = import.meta.env.VITE_APP_URL;
