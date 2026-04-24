import { createClient } from "@supabase/supabase-js";

import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

export function getSupabaseStatelessClient() {
  assertSupabaseEnv();

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
