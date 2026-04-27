"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function toSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readRequired(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatório: ${name}`);
  }
  return value.trim();
}

function withNotice(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}notice=${Date.now()}`;
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const cookieStore = await cookies();

  const name = readRequired(formData, "name");
  const slug = toSlug(readRequired(formData, "slug"));

  if (!slug) {
    redirect(withNotice("/dashboard?error=Informe+um+slug+valido"));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("domain_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.domain_id) {
    redirect(withNotice("/dashboard?error=Perfil+sem+dominio+valido"));
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      domain_id: profile.domain_id,
      name,
      slug,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (workspaceError || !workspace) {
    redirect(withNotice(`/dashboard?error=${encodeURIComponent(workspaceError?.message ?? "Falha ao criar workspace")}`));
  }

  const { error: membershipError } = await supabase.from("workspace_memberships").insert({
    domain_id: profile.domain_id,
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (membershipError) {
    redirect(withNotice(`/dashboard?error=${encodeURIComponent(membershipError.message)}`));
  }

  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  revalidatePath("/dashboard");
  redirect(withNotice("/dashboard?success=Workspace+criado"));
}

export async function switchWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const cookieStore = await cookies();
  const workspaceId = readRequired(formData, "workspaceId");

  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    redirect(withNotice("/dashboard?error=Workspace+invalido"));
  }

  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  revalidatePath("/dashboard");
  redirect(withNotice("/dashboard?success=Workspace+alterado"));
}

export async function updateWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const workspaceId = readRequired(formData, "workspaceId");
  const name = readRequired(formData, "name");
  const slug = toSlug(readRequired(formData, "slug"));

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) {
    redirect(withNotice("/dashboard/settings?error=Sem+permissao"));
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ name, slug })
    .eq("id", workspaceId);

  if (error) {
    redirect(withNotice(`/dashboard/settings?error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect(withNotice("/dashboard/settings?success=Workspace+atualizado"));
}
