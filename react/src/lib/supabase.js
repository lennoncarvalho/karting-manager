import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://pallvdbokvjzctjfntuq.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_mv_q4LZt5xHqfGL582Uoqw_01KcjSLy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const APP_URL =
  import.meta.env.VITE_APP_URL || "https://karting-manager.pages.dev/";
