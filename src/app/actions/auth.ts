"use server";

import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function readField(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatório: ${field}`);
  }

  return value.trim();
}

export async function signInAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const next = formData.get("next");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, theme_preference")
      .eq("id", data.user.id)
      .maybeSingle();

    console.info("[avatar-debug] sign-in", {
      auth_metadata_avatar_url:
        typeof data.user.user_metadata?.avatar_url === "string" ? data.user.user_metadata.avatar_url : null,
      profile_avatar_url: profile?.avatar_url ?? null,
      profile_error: profileError?.message ?? null,
      user_id: data.user.id,
    });

    if (profile && !profileError) {
      const shouldSyncMetadata =
        profile.avatar_url !==
          (typeof data.user.user_metadata?.avatar_url === "string"
            ? data.user.user_metadata.avatar_url
            : null) ||
        profile.full_name !==
          (typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : "") ||
        profile.theme_preference !==
          (typeof data.user.user_metadata?.theme_preference === "string"
            ? data.user.user_metadata.theme_preference
            : "light");

      if (shouldSyncMetadata) {
        const { error: syncError } = await supabase.auth.updateUser({
          data: {
            avatar_url: profile.avatar_url,
            full_name: profile.full_name ?? "",
            theme_preference: profile.theme_preference ?? "light",
          },
        });

        console.info("[avatar-debug] sign-in-metadata-sync", {
          avatar_url: profile.avatar_url ?? null,
          error: syncError?.message ?? null,
          user_id: data.user.id,
        });
      }
    }
  }

  if (typeof next === "string" && next.startsWith("/")) {
    redirect(next);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/auth/sign-in?message=Conta criada. Verifique seu email para concluir o acesso.");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
