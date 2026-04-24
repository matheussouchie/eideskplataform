import Link from "next/link";
import { notFound } from "next/navigation";

import { assumeTicketAction, updateTicketStatusAction } from "@/app/actions/tickets";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getTicketById,
  getTicketComments,
  getWorkspaceTicketStatuses,
  requireActiveWorkspace,
} from "@/lib/workspaces";

function priorityVariant(priority: "low" | "medium" | "high" | "urgent") {
  switch (priority) {
    case "urgent":
      return "priority-urgent";
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    default:
      return "priority-low";
  }
}

export default async function TicketDetailsPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const activeMembership = await requireActiveWorkspace();
  const ticket = await getTicketById(activeMembership.workspace!.id, ticketId);

  if (!ticket) {
    notFound();
  }

  const comments = await getTicketComments(ticket.id, activeMembership.workspace!.id);
  const statuses = await getWorkspaceTicketStatuses(activeMembership.workspace!.id);
  const canManageWorkflow = activeMembership.role === "agent";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link href="/dashboard/tickets" className="text-sm font-semibold text-sky-700">
            Voltar para o kanban
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Ticket #{ticket.id.slice(-3)}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              {ticket.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{ticket.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={priorityVariant(ticket.priority)}>
              {ticket.priority === "urgent"
                ? "Urgente"
                : ticket.priority === "high"
                  ? "Alta"
                  : ticket.priority === "medium"
                    ? "Media"
                    : "Baixa"}
            </Badge>
            <Badge
              variant={
                ticket.status_info?.name === "Em atendimento"
                  ? "status-progress"
                  : ticket.status_info?.name === "Aguardando cliente"
                    ? "status-waiting"
                    : ticket.status_info?.name === "Novo"
                    ? "status-open"
                    : "status-resolved"
              }
            >
              {ticket.status_info?.name ?? "Status"}
            </Badge>
          </div>
        </div>

        {canManageWorkflow ? (
          <div className="flex w-full max-w-sm flex-col gap-3">
            {!ticket.assigned_to ? (
              <form
                action={assumeTicketAction}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <input type="hidden" name="ticketId" value={ticket.id} />
                <SubmitButton
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  pendingLabel="Assumindo..."
                >
                  Assumir ticket
                </SubmitButton>
              </form>
            ) : null}

            <form
              action={updateTicketStatusAction}
              className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Atualizar status</span>
                <select
                  name="statusId"
                  defaultValue={ticket.status_id}
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400 focus:bg-white"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                pendingLabel="Salvando..."
              >
                Salvar status
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Contexto</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Cliente</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.requester?.full_name ?? "Cliente nao encontrado"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Responsavel</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.assignee?.full_name ?? "Sem responsavel"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Departamento</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.department?.name ?? "Nao definido"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Time</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.team?.name ?? "Nao definido"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Criado em</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {new Date(ticket.created_at).toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ultima atualizacao</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {new Date(ticket.updated_at).toLocaleString("pt-BR")}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Historico publico</h2>
              <p className="mt-1 text-sm text-slate-500">Mensagens reais associadas a este ticket.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {comments.length} mensagens
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {comments.length ? (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {comment.author?.full_name ?? "Usuario"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="neutral">Publico</Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment.body}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                Ainda nao ha mensagens publicas neste ticket.
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
