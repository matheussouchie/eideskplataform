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

  const allowedPriorities: Database["public"]["Enums"]["ticket_priority"][] = [
    "low",
    "medium",
    "high",
    "urgent",
  ];

  if (!allowedPriorities.includes(priority)) {
    redirect("/dashboard/tickets?error=Prioridade+invalida");
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      workspace_id: activeMembership.workspace!.id,
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
  const status = readRequired(formData, "status") as Database["public"]["Enums"]["ticket_status"];

  const allowedStatuses: Database["public"]["Enums"]["ticket_status"][] = [
    "open",
    "in_progress",
    "resolved",
    "closed",
  ];

  if (!allowedStatuses.includes(status)) {
    redirect("/dashboard/tickets?error=Status+invalido");
  }

  if (!["owner", "admin", "agent"].includes(activeMembership.role)) {
    redirect("/dashboard/tickets?error=Sem+permissao+para+alterar+status");
  }

  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("workspace_id", activeMembership.workspace!.id)
    .maybeSingle();

  if (lookupError || !ticket) {
    redirect("/dashboard/tickets?error=Ticket+nao+encontrado");
  }

  const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);

  if (error) {
    redirect(`/dashboard/tickets?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("ticket_comments").insert({
    workspace_id: activeMembership.workspace!.id,
    ticket_id: ticketId,
    author_id: user.id,
    body: `Status alterado para ${status}.`,
    internal: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  redirect("/dashboard/tickets?success=Status+atualizado");
}
