"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database, "public">> | null = null;

export function getSupabaseBrowserClient() {
  assertSupabaseEnv();

  if (!browserClient) {
    browserClient = createBrowserClient<Database, "public">(env.supabaseUrl, env.supabaseAnonKey) as any;
  }

  return browserClient;
}
