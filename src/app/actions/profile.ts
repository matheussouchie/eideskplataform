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
  const themePreference = readOptionalText(formData, "themePreference");
  const avatar = formData.get("avatar");

  if (!fullName || fullName.length < 3) {
    redirectToProfile("Informe um nome com pelo menos 3 caracteres", "error");
  }

  if (themePreference && !["light", "dark"].includes(themePreference)) {
    redirectToProfile("Tema invalido", "error");
  }

  const { data: currentProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("avatar_url, domain_id, full_name, theme_preference")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError || !currentProfile?.domain_id) {
    redirectToProfile(profileLookupError?.message ?? "Perfil invalido", "error");
  }

  const nextFullName = fullName || currentProfile.full_name || user.email || "Usuario";
  const nextThemePreference = themePreference || currentProfile.theme_preference || "light";
  let nextAvatarPath = currentProfile?.avatar_url ?? null;
  let warningMessage: string | null = null;

  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > MAX_AVATAR_SIZE) {
      warningMessage = "A foto nao foi enviada porque excede 50MB.";
    } else {
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
        warningMessage = `A foto nao foi enviada: ${uploadError.message}`;
      } else {
        nextAvatarPath = storagePath;

        if (currentProfile?.avatar_url && currentProfile.avatar_url !== storagePath) {
          await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([currentProfile.avatar_url]);
        }
      }
    }
  }
  const authPayload: {
    data: { full_name: string };
    email?: string;
    password?: string;
  } = {
    data: {
      full_name: nextFullName,
    },
  };

  if (email && email !== user.email) {
    if (!email.includes("@")) {
      redirectToProfile("Informe um email valido", "error");
    }
    authPayload.email = email;
  }

  if (password) {
    authPayload.password = password;
  }

  const shouldUpdateAuth = Boolean(authPayload.email || authPayload.password || nextFullName !== (user.user_metadata?.full_name ?? user.email));
  if (shouldUpdateAuth) {
    const { error: authError } = await supabase.auth.updateUser(authPayload);

    if (authError) {
      const normalizedMessage = authError.message.toLowerCase();
      const isSamePasswordError =
        normalizedMessage.includes("password should be different") ||
        normalizedMessage.includes("new password should be different");

      if (authPayload.password && isSamePasswordError) {
        warningMessage =
          warningMessage ??
          "Os demais dados foram salvos. A senha nao foi alterada porque o Supabase exige uma senha diferente da atual.";
      } else {
        redirectToProfile(authError.message, "error");
      }
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: nextAvatarPath,
      full_name: nextFullName,
      theme_preference: nextThemePreference,
    })
    .eq("id", user.id)
    .eq("domain_id", currentProfile.domain_id);

  if (profileError) {
    redirectToProfile(profileError.message, "error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/tickets");
  redirectToProfile(warningMessage ?? "Perfil atualizado com sucesso", "success");
}

export async function persistThemePreferenceAction(themePreference: string) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  if (!["light", "dark"].includes(themePreference)) {
    throw new Error("Tema invalido");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("domain_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.domain_id) {
    throw new Error(profileError?.message ?? "Perfil invalido");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: themePreference })
    .eq("id", user.id)
    .eq("domain_id", profile.domain_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return { success: true } as const;
}

export async function updateThemePreferenceAction(formData: FormData) {
  const themePreference = readOptionalText(formData, "themePreference");
  const redirectTo = readOptionalText(formData, "redirectTo") || "/dashboard";

  try {
    await persistThemePreferenceAction(themePreference);
  } catch (error) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent((error as Error).message)}&notice=${Date.now()}`);
  }

  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}success=${encodeURIComponent("Tema atualizado")}&notice=${Date.now()}`);
}
