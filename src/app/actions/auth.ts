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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
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
