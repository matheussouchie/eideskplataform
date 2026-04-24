"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveWorkspace } from "@/lib/workspaces";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseStatelessClient } from "@/lib/supabase/stateless";

const SETTINGS_ROUTE = "/dashboard/settings";

function redirectToSettings(panel: string, message: string, type: "error" | "success") {
  redirect(`${SETTINGS_ROUTE}?panel=${panel}&${type}=${encodeURIComponent(message)}`);
}

function readRequiredText(formData: FormData, name: string, options?: { maxLength?: number; minLength?: number }) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatorio: ${name}`);
  }

  const normalized = value.trim();

  if (options?.minLength && normalized.length < options.minLength) {
    throw new Error(`Campo ${name} precisa ter pelo menos ${options.minLength} caracteres.`);
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    throw new Error(`Campo ${name} excede o limite de ${options.maxLength} caracteres.`);
  }

  return normalized;
}

function readOptionalUuid(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(normalized)) {
    throw new Error(`Campo invalido: ${name}`);
  }

  return normalized;
}

function readRequiredUuid(formData: FormData, name: string) {
  const value = readRequiredText(formData, name);
  if (!/^[0-9a-fA-F-]{36}$/.test(value)) {
    throw new Error(`Campo invalido: ${name}`);
  }
  return value;
}

async function requireAdminWorkspaceAccess() {
  const activeMembership = await requireActiveWorkspace();

  if (!["owner", "admin"].includes(activeMembership.role)) {
    redirectToSettings("workspace", "Sem permissao para acessar o painel admin", "error");
  }

  return activeMembership;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createAgentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const fullName = readRequiredText(formData, "fullName", { maxLength: 120, minLength: 3 });
  const email = normalizeEmail(readRequiredText(formData, "email", { maxLength: 160, minLength: 5 }));
  const password = readRequiredText(formData, "password", { maxLength: 72, minLength: 8 });
  const teamId = readRequiredUuid(formData, "teamId");

  try {
    const authClient = getSupabaseStatelessClient();
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error || !data.user?.id) {
      throw new Error(error?.message ?? "Nao foi possivel criar o usuario do agente.");
    }

    const supabase = await getSupabaseServerClient();
    const { error: rpcError } = await supabase.rpc("provision_workspace_agent", {
      agent_full_name: fullName,
      agent_user_id: data.user.id,
      team_uuid: teamId,
      workspace_uuid: activeMembership.workspace!.id,
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }
  } catch (error) {
    redirectToSettings("agents", (error as Error).message, "error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("agents", "Agente criado com sucesso", "success");
}

export async function updateAgentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const agentUserId = readRequiredUuid(formData, "agentUserId");
  const fullName = readRequiredText(formData, "fullName", { maxLength: 120, minLength: 3 });
  const teamId = readRequiredUuid(formData, "teamId");
  const isActive = formData.get("isActive") === "on";

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("update_workspace_agent", {
      active: isActive,
      agent_full_name: fullName,
      agent_user_id: agentUserId,
      team_uuid: teamId,
      workspace_uuid: activeMembership.workspace!.id,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("agents", (error as Error).message, "error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("agents", "Agente atualizado com sucesso", "success");
}

export async function archiveAgentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const agentUserId = readRequiredUuid(formData, "agentUserId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("archive_workspace_agent", {
      agent_user_id: agentUserId,
      workspace_uuid: activeMembership.workspace!.id,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("agents", (error as Error).message, "error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("agents", "Agente arquivado com sucesso", "success");
}

export async function createProductAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });
  const parentId = readOptionalUuid(formData, "parentId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("products").insert({
      domain_id: activeMembership.workspace!.domain_id,
      name,
      parent_id: parentId,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("products", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("products", "Produto criado com sucesso", "success");
}

export async function updateProductAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const productId = readRequiredUuid(formData, "productId");
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });
  const parentId = readOptionalUuid(formData, "parentId");

  if (parentId && parentId === productId) {
    redirectToSettings("products", "Um produto nao pode ser pai dele mesmo", "error");
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("products")
      .update({ name, parent_id: parentId })
      .eq("id", productId)
      .eq("domain_id", activeMembership.workspace!.domain_id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("products", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("products", "Produto atualizado com sucesso", "success");
}

export async function deleteProductAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const productId = readRequiredUuid(formData, "productId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("domain_id", activeMembership.workspace!.domain_id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("products", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("products", "Produto removido com sucesso", "success");
}

export async function createCategoryAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("categories").insert({
      domain_id: activeMembership.workspace!.domain_id,
      name,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("categories", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("categories", "Categoria criada com sucesso", "success");
}

export async function updateCategoryAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const categoryId = readRequiredUuid(formData, "categoryId");
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", categoryId)
      .eq("domain_id", activeMembership.workspace!.domain_id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("categories", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("categories", "Categoria atualizada com sucesso", "success");
}

export async function deleteCategoryAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const categoryId = readRequiredUuid(formData, "categoryId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("domain_id", activeMembership.workspace!.domain_id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("categories", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("categories", "Categoria removida com sucesso", "success");
}

export async function createDepartmentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("departments").insert({
      domain_id: activeMembership.workspace!.domain_id,
      name,
      workspace_id: activeMembership.workspace!.id,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("departments", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("departments", "Departamento criado com sucesso", "success");
}

export async function updateDepartmentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const departmentId = readRequiredUuid(formData, "departmentId");
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("departments")
      .update({ name })
      .eq("id", departmentId)
      .eq("workspace_id", activeMembership.workspace!.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("departments", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("departments", "Departamento atualizado com sucesso", "success");
}

export async function deleteDepartmentAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const departmentId = readRequiredUuid(formData, "departmentId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", departmentId)
      .eq("workspace_id", activeMembership.workspace!.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("departments", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("departments", "Departamento removido com sucesso", "success");
}

export async function createTeamAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });
  const departmentId = readRequiredUuid(formData, "departmentId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("teams").insert({
      department_id: departmentId,
      domain_id: activeMembership.workspace!.domain_id,
      name,
      workspace_id: activeMembership.workspace!.id,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("teams", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("teams", "Time criado com sucesso", "success");
}

export async function updateTeamAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const teamId = readRequiredUuid(formData, "teamId");
  const name = readRequiredText(formData, "name", { maxLength: 80, minLength: 2 });
  const departmentId = readRequiredUuid(formData, "departmentId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("teams")
      .update({ department_id: departmentId, name })
      .eq("id", teamId)
      .eq("workspace_id", activeMembership.workspace!.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("teams", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("teams", "Time atualizado com sucesso", "success");
}

export async function deleteTeamAction(formData: FormData) {
  const activeMembership = await requireAdminWorkspaceAccess();
  const teamId = readRequiredUuid(formData, "teamId");

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("workspace_id", activeMembership.workspace!.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectToSettings("teams", (error as Error).message, "error");
  }

  revalidatePath("/dashboard/tickets");
  revalidatePath(SETTINGS_ROUTE);
  redirectToSettings("teams", "Time removido com sucesso", "success");
}
