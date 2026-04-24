"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces";
import type { Database } from "@/types/database";

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const ATTACHMENTS_BUCKET = "ticket-attachments";
const WORKFLOW_ROLES: Database["public"]["Enums"]["workspace_role"][] = ["owner", "admin", "agent"];

type AgentMembershipLookupRow = {
  created_at: string;
  role: Database["public"]["Enums"]["workspace_role"];
  user_id: string;
};

type AgentProfileLookupRow = {
  id: string;
  is_active: boolean;
  team_id: string | null;
};

function readRequired(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatorio: ${name}`);
  }
  return value.trim();
}

function readRedirectTarget(formData: FormData, fallback: string) {
  const value = formData.get("redirectTo");
  return typeof value === "string" && value.startsWith("/dashboard") ? value : fallback;
}

function revalidateTicketViews(ticketId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");

  if (ticketId) {
    revalidatePath(`/dashboard/tickets/${ticketId}`);
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function resolveAutoAssignee(args: {
  workspaceId: string;
  teamId: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("workspace_memberships")
    .select("user_id, created_at, role")
    .eq("workspace_id", args.workspaceId)
    .eq("role", "agent")
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const membershipRows = (memberships ?? []) as AgentMembershipLookupRow[];
  const candidateIds = membershipRows.map((membership: AgentMembershipLookupRow) => membership.user_id);

  if (!candidateIds.length) {
    return null;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, team_id, is_active")
    .in("id", candidateIds)
    .eq("team_id", args.teamId)
    .eq("is_active", true);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const activeProfiles = (profiles ?? []) as AgentProfileLookupRow[];
  const activeCandidates = membershipRows
    .filter((membership: AgentMembershipLookupRow) =>
      activeProfiles.some(
        (profile: AgentProfileLookupRow) => profile.id === membership.user_id && profile.is_active,
      ),
    )
    .map((membership: AgentMembershipLookupRow) => membership.user_id);

  if (!activeCandidates.length) {
    return null;
  }

  const { data: lastAssignedTicket, error: lastAssignedError } = await supabase
    .from("tickets")
    .select("assigned_to, created_at")
    .eq("workspace_id", args.workspaceId)
    .eq("team_id", args.teamId)
    .in("assigned_to", activeCandidates)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAssignedError) {
    throw new Error(lastAssignedError.message);
  }

  if (!lastAssignedTicket?.assigned_to) {
    return activeCandidates[0];
  }

  const currentIndex = activeCandidates.findIndex((candidateId) => candidateId === lastAssignedTicket.assigned_to);
  if (currentIndex === -1) {
    return activeCandidates[0];
  }

  return activeCandidates[(currentIndex + 1) % activeCandidates.length];
}

async function insertWorkflowComment(args: {
  authorId: string;
  body: string;
  domainId: string;
  internal: boolean;
  ticketId: string;
  workspaceId: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("ticket_comments").insert({
    author_id: args.authorId,
    body: args.body,
    domain_id: args.domainId,
    internal: args.internal,
    ticket_id: args.ticketId,
    workspace_id: args.workspaceId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createTicketAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();

  const title = readRequired(formData, "title");
  const description = readRequired(formData, "description");
  const priority = readRequired(formData, "priority") as Database["public"]["Enums"]["ticket_priority"];
  const departmentId = readRequired(formData, "departmentId");
  const teamId = readRequired(formData, "teamId");
  const productId = readRequired(formData, "productId");
  const categoryId = readRequired(formData, "categoryId");

  const allowedPriorities: Database["public"]["Enums"]["ticket_priority"][] = [
    "low",
    "medium",
    "high",
    "urgent",
  ];

  if (!allowedPriorities.includes(priority)) {
    redirect("/dashboard/tickets?error=Prioridade+invalida");
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, department_id, domain_id")
    .eq("id", teamId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (teamError || !team) {
    redirect("/dashboard/tickets?error=Time+invalido");
  }

  if (team.department_id !== departmentId) {
    redirect("/dashboard/tickets?error=Time+nao+pertence+ao+departamento+selecionado");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, domain_id")
    .eq("id", productId)
    .eq("domain_id", team.domain_id)
    .maybeSingle();

  if (productError || !product) {
    redirect("/dashboard/tickets?error=Produto+invalido");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, domain_id")
    .eq("id", categoryId)
    .eq("domain_id", team.domain_id)
    .maybeSingle();

  if (categoryError || !category) {
    redirect("/dashboard/tickets?error=Categoria+invalida");
  }

  const { data: initialStatus, error: initialStatusError } = await supabase
    .from("ticket_statuses")
    .select("id")
    .eq("workspace_id", activeMembership.workspace!.id)
    .order("order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (initialStatusError || !initialStatus) {
    redirect("/dashboard/tickets?error=Status+inicial+nao+configurado");
  }

  const autoAssignedTo = await resolveAutoAssignee({
    workspaceId: activeMembership.workspace!.id,
    teamId,
  });

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      assigned_to: autoAssignedTo,
      category_id: categoryId,
      department_id: departmentId,
      description,
      domain_id: team.domain_id,
      priority,
      product_id: productId,
      requester_id: user.id,
      status_id: initialStatus.id,
      team_id: teamId,
      title,
      workspace_id: activeMembership.workspace!.id,
    })
    .select("*")
    .single();

  if (error || !ticket) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(error?.message ?? "Falha ao criar ticket")}`);
  }

  try {
    await insertWorkflowComment({
      authorId: user.id,
      body: "Ticket criado pelo solicitante.",
      domainId: team.domain_id,
      internal: activeMembership.role !== "requester",
      ticketId: ticket.id,
      workspaceId: activeMembership.workspace!.id,
    });

    if (autoAssignedTo && activeMembership.role !== "requester") {
      await insertWorkflowComment({
        authorId: user.id,
        body: "Ticket distribuido automaticamente para um agente ativo do time.",
        domainId: team.domain_id,
        internal: true,
        ticketId: ticket.id,
        workspaceId: activeMembership.workspace!.id,
      });
    }
  } catch (commentError) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent((commentError as Error).message)}`);
  }

  revalidateTicketViews(ticket.id);
  redirect("/dashboard/tickets?success=Ticket+criado");
}

async function updateTicketStatusCore(args: {
  statusId: string;
  ticketId: string;
  userId: string;
  workspaceId: string;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("id, assigned_to, domain_id, workspace_id")
    .eq("id", args.ticketId)
    .eq("workspace_id", args.workspaceId)
    .maybeSingle();

  if (lookupError || !ticket) {
    return {
      error: "Ticket nao encontrado",
      success: false,
    } as const;
  }

  const { data: statusRecord, error: statusLookupError } = await supabase
    .from("ticket_statuses")
    .select("id, name")
    .eq("id", args.statusId)
    .eq("workspace_id", args.workspaceId)
    .maybeSingle();

  if (statusLookupError || !statusRecord) {
    return {
      error: "Status invalido",
      success: false,
    } as const;
  }

  const { error } = await supabase.from("tickets").update({ status_id: args.statusId }).eq("id", args.ticketId);

  if (error) {
    return {
      error: error.message,
      success: false,
    } as const;
  }

  await insertWorkflowComment({
    authorId: args.userId,
    body: `Status alterado para ${statusRecord.name}.`,
    domainId: ticket.domain_id,
    internal: true,
    ticketId: args.ticketId,
    workspaceId: args.workspaceId,
  });

  revalidateTicketViews(args.ticketId);

  return {
    success: true,
  } as const;
}

export async function moveTicketStatusAction(args: { statusId: string; ticketId: string }) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();

  if (!WORKFLOW_ROLES.includes(activeMembership.role)) {
    return {
      error: "Sem permissao para mover tickets no kanban",
      success: false,
    } as const;
  }

  return updateTicketStatusCore({
    statusId: args.statusId,
    ticketId: args.ticketId,
    userId: user.id,
    workspaceId: activeMembership.workspace!.id,
  });
}

export async function updateTicketStatusAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const ticketId = readRequired(formData, "ticketId");
  const statusId = readRequired(formData, "statusId");
  const redirectTo = readRedirectTarget(formData, `/dashboard/tickets/${ticketId}`);

  if (!WORKFLOW_ROLES.includes(activeMembership.role)) {
    redirect(`${redirectTo}?error=Sem+permissao+para+alterar+status`);
  }

  const result = await updateTicketStatusCore({
    statusId,
    ticketId,
    userId: user.id,
    workspaceId: activeMembership.workspace!.id,
  });

  if (!result.success) {
    redirect(`${redirectTo}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`${redirectTo}?success=Status+atualizado`);
}

export async function assumeTicketAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();
  const ticketId = readRequired(formData, "ticketId");
  const redirectTo = readRedirectTarget(formData, "/dashboard/tickets");

  if (!WORKFLOW_ROLES.includes(activeMembership.role)) {
    redirect(`${redirectTo}?error=Sem+permissao+para+assumir+ticket`);
  }

  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("id, assigned_to, domain_id, workspace_id")
    .eq("id", ticketId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (lookupError || !ticket) {
    redirect(`${redirectTo}?error=Ticket+nao+encontrado`);
  }

  if (ticket.assigned_to) {
    redirect(`${redirectTo}?error=Ticket+ja+possui+responsavel`);
  }

  const { error } = await supabase.from("tickets").update({ assigned_to: user.id }).eq("id", ticketId);

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await insertWorkflowComment({
    authorId: user.id,
    body: "Ticket assumido pelo agente.",
    domainId: ticket.domain_id,
    internal: true,
    ticketId,
    workspaceId: ticket.workspace_id,
  });

  revalidateTicketViews(ticketId);
  redirect(`${redirectTo}?success=Ticket+assumido`);
}

export async function postTicketMessageAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();

  const ticketId = readRequired(formData, "ticketId");
  const bodyValue = formData.get("body");
  const visibility = typeof formData.get("visibility") === "string" ? String(formData.get("visibility")) : "public";
  const redirectTo = readRedirectTarget(formData, `/dashboard/tickets/${ticketId}`);
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  const internal = visibility === "internal";
  const attachmentFiles = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!body && !attachmentFiles.length) {
    redirect(`${redirectTo}?error=Informe+uma+mensagem+ou+adicione+um+anexo`);
  }

  if (internal && activeMembership.role === "requester") {
    redirect(`${redirectTo}?error=Solicitantes+nao+podem+enviar+mensagens+internas`);
  }

  for (const attachment of attachmentFiles) {
    if (attachment.size > MAX_ATTACHMENT_SIZE) {
      redirect(`${redirectTo}?error=Cada+anexo+deve+ter+no+maximo+50MB`);
    }
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, domain_id, workspace_id")
    .eq("id", ticketId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (ticketError || !ticket) {
    redirect(`${redirectTo}?error=Ticket+nao+encontrado`);
  }

  const commentId = randomUUID();
  const { error: commentError } = await supabase.from("ticket_comments").insert({
    author_id: user.id,
    body: body || (internal ? "Anexo interno enviado." : "Anexo enviado."),
    domain_id: ticket.domain_id,
    id: commentId,
    internal,
    ticket_id: ticket.id,
    workspace_id: ticket.workspace_id,
  });

  if (commentError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(commentError.message)}`);
  }

  const uploadedPaths: string[] = [];

  try {
    for (const attachment of attachmentFiles) {
      const attachmentId = randomUUID();
      const storagePath = `${ticket.workspace_id}/${ticket.id}/${commentId}/${attachmentId}-${sanitizeFileName(attachment.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(storagePath, attachment, {
          cacheControl: "3600",
          contentType: attachment.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(storagePath);

      const { error: attachmentError } = await supabase.from("ticket_attachments").insert({
        bucket_id: ATTACHMENTS_BUCKET,
        comment_id: commentId,
        content_type: attachment.type || "application/octet-stream",
        domain_id: ticket.domain_id,
        file_name: attachment.name,
        file_size: attachment.size,
        id: attachmentId,
        storage_path: storagePath,
        ticket_id: ticket.id,
        uploaded_by: user.id,
        workspace_id: ticket.workspace_id,
      });

      if (attachmentError) {
        throw new Error(attachmentError.message);
      }
    }
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove(uploadedPaths);
    }

    await supabase.from("ticket_attachments").delete().eq("comment_id", commentId);
    await supabase.from("ticket_comments").delete().eq("id", commentId);
    redirect(`${redirectTo}?error=${encodeURIComponent((error as Error).message)}`);
  }

  revalidateTicketViews(ticket.id);
  redirect(`${redirectTo}?success=Mensagem+enviada`);
}
