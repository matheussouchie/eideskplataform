"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces";
import type { Database } from "@/types/database";

function readRequired(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatório: ${name}`);
  }
  return value.trim();
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

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      domain_id: team.domain_id,
      workspace_id: activeMembership.workspace!.id,
      status_id: initialStatus.id,
      department_id: departmentId,
      team_id: teamId,
      requester_id: user.id,
      title,
      description,
      priority,
    })
    .select("*")
    .single();

  if (error || !ticket) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(error?.message ?? "Falha ao criar ticket")}`);
  }

  const { error: commentError } = await supabase.from("ticket_comments").insert({
    domain_id: team.domain_id,
    workspace_id: activeMembership.workspace!.id,
    ticket_id: ticket.id,
    author_id: user.id,
    body: "Ticket criado pelo solicitante.",
    internal: true,
  });

  if (commentError) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(commentError.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  redirect("/dashboard/tickets?success=Ticket+criado");
}

export async function updateTicketStatusAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();

  const ticketId = readRequired(formData, "ticketId");
  const statusId = readRequired(formData, "statusId");

  if (activeMembership.role !== "agent") {
    redirect("/dashboard/tickets?error=Sem+permissao+para+alterar+status");
  }

  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("id, assigned_to, domain_id")
    .eq("id", ticketId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (lookupError || !ticket) {
    redirect("/dashboard/tickets?error=Ticket+nao+encontrado");
  }

  const { data: statusRecord, error: statusLookupError } = await supabase
    .from("ticket_statuses")
    .select("id, name")
    .eq("id", statusId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (statusLookupError || !statusRecord) {
    redirect("/dashboard/tickets?error=Status+invalido");
  }

  const { error } = await supabase.from("tickets").update({ status_id: statusId }).eq("id", ticketId);

  if (error) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("ticket_comments").insert({
    domain_id: ticket.domain_id,
    workspace_id: activeMembership.workspace!.id,
    ticket_id: ticketId,
    author_id: user.id,
    body: `Status alterado para ${statusRecord.name}.`,
    internal: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  redirect("/dashboard/tickets?success=Status+atualizado");
}

export async function assumeTicketAction(formData: FormData) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();
  const ticketId = readRequired(formData, "ticketId");

  if (activeMembership.role !== "agent") {
    redirect("/dashboard/tickets?error=Sem+permissao+para+assumir+ticket");
  }

  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("id, assigned_to, domain_id, workspace_id")
    .eq("id", ticketId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (lookupError || !ticket) {
    redirect("/dashboard/tickets?error=Ticket+nao+encontrado");
  }

  if (ticket.assigned_to) {
    redirect("/dashboard/tickets?error=Ticket+ja+possui+responsavel");
  }

  const { error } = await supabase.from("tickets").update({ assigned_to: user.id }).eq("id", ticketId);

  if (error) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("ticket_comments").insert({
    domain_id: ticket.domain_id,
    workspace_id: ticket.workspace_id,
    ticket_id: ticketId,
    author_id: user.id,
    body: "Ticket assumido pelo agente.",
    internal: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  redirect("/dashboard/tickets?success=Ticket+assumido");
}
