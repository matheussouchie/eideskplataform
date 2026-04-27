"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_AVATAR_SIZE = 50 * 1024 * 1024;
const PROFILE_AVATAR_BUCKET = "profile-avatars";

function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function redirectToProfile(message: string, type: "error" | "success") {
  redirect(`/dashboard/profile?${type}=${encodeURIComponent(message)}&notice=${Date.now()}`);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const fullName = readOptionalText(formData, "fullName");
  const email = readOptionalText(formData, "email").toLowerCase();
  const password = readOptionalText(formData, "password");
  const themePreference = readOptionalText(formData, "themePreference") || "light";
  const avatar = formData.get("avatar");

  if (!fullName || fullName.length < 3) {
    redirectToProfile("Informe um nome com pelo menos 3 caracteres", "error");
  }

  if (!email || !email.includes("@")) {
    redirectToProfile("Informe um email valido", "error");
  }

  if (!["light", "dark"].includes(themePreference)) {
    redirectToProfile("Tema invalido", "error");
  }

  if (password && password.length < 8) {
    redirectToProfile("A senha precisa ter pelo menos 8 caracteres", "error");
  }

  const { data: currentProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("avatar_url, domain_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError || !currentProfile?.domain_id) {
    redirectToProfile(profileLookupError?.message ?? "Perfil invalido", "error");
  }

  let nextAvatarPath = currentProfile?.avatar_url ?? null;

  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > MAX_AVATAR_SIZE) {
      redirectToProfile("A foto precisa ter no maximo 50MB", "error");
    }

    const extension = avatar.name.includes(".") ? avatar.name.split(".").pop() : "bin";
    const storagePath = `${user.id}/avatar-${randomUUID()}-${sanitizeFileName(`profile.${extension}`)}`;
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(storagePath, avatar, {
        cacheControl: "3600",
        contentType: avatar.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      redirectToProfile(uploadError.message, "error");
    }

    nextAvatarPath = storagePath;

    if (currentProfile?.avatar_url && currentProfile.avatar_url !== storagePath) {
      await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([currentProfile.avatar_url]);
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
    email,
    password: password || undefined,
  });

  if (authError) {
    redirectToProfile(authError.message, "error");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: nextAvatarPath,
      full_name: fullName,
      theme_preference: themePreference,
    })
    .eq("id", user.id)
    .eq("domain_id", currentProfile.domain_id);

  if (profileError) {
    redirectToProfile(profileError.message, "error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/tickets");
  redirectToProfile("Perfil atualizado com sucesso", "success");
}

export async function updateThemePreferenceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const themePreference = readOptionalText(formData, "themePreference");
  const redirectTo = readOptionalText(formData, "redirectTo") || "/dashboard";

  if (!["light", "dark"].includes(themePreference)) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Tema invalido")}&notice=${Date.now()}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("domain_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.domain_id) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(profileError?.message ?? "Perfil invalido")}&notice=${Date.now()}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: themePreference })
    .eq("id", user.id)
    .eq("domain_id", profile.domain_id);

  if (error) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(error.message)}&notice=${Date.now()}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}success=${encodeURIComponent("Tema atualizado")}&notice=${Date.now()}`);
}
