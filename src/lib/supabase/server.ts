import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function getSupabaseServerClient() {
  assertSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient<Database, "public">(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList: CookieMutation[]) {
        for (const cookie of cookieList) {
          cookieStore.set(cookie.name, cookie.value, cookie.options as any);
        }
      },
    },
  }) as any;
}
