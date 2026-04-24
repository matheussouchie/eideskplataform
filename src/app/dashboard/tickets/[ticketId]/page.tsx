import Link from "next/link";
import { notFound } from "next/navigation";

import {
  assumeTicketAction,
  postTicketMessageAction,
  updateTicketStatusAction,
} from "@/app/actions/tickets";
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

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

export default async function TicketDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { ticketId } = await params;
  const query = await searchParams;
  const activeMembership = await requireActiveWorkspace();
  const ticket = await getTicketById(activeMembership.workspace!.id, ticketId);

  if (!ticket) {
    notFound();
  }

  const canManageWorkflow = ["owner", "admin", "agent"].includes(activeMembership.role);
  const canUseInternalMessages = activeMembership.role !== "requester";
  const comments = await getTicketComments(ticket.id, activeMembership.workspace!.id, {
    includeInternal: canUseInternalMessages,
  });
  const publicComments = comments.filter((comment) => !comment.internal);
  const internalComments = comments.filter((comment) => comment.internal);
  const statuses = await getWorkspaceTicketStatuses(activeMembership.workspace!.id);

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
                <input type="hidden" name="redirectTo" value={`/dashboard/tickets/${ticket.id}`} />
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
              <input type="hidden" name="redirectTo" value={`/dashboard/tickets/${ticket.id}`} />
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

      {query.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {query.error}
        </p>
      ) : null}
      {query.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {query.success}
        </p>
      ) : null}

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
              {ticket.assignee ? (
                <dd className="mt-1 text-xs text-slate-500">
                  {ticket.assignee.is_active ? "Agente ativo" : "Agente inativo"}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-slate-500">Departamento</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.department?.name ?? "Nao definido"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Produto</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.product?.name ?? "Nao definido"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Categoria</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {ticket.category?.name ?? "Nao definida"}
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

        <div className="space-y-5">
          <Card className="p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Nova mensagem</h2>
              <p className="mt-1 text-sm text-slate-500">
                Envie atualizacoes publicas para o cliente ou notas internas para o time.
              </p>
            </div>

            <form className="mt-5 grid gap-3" action={postTicketMessageAction}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input type="hidden" name="redirectTo" value={`/dashboard/tickets/${ticket.id}`} />

              {canUseInternalMessages ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Visibilidade</span>
                  <select
                    name="visibility"
                    defaultValue="public"
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                  >
                    <option value="public">Mensagem publica</option>
                    <option value="internal">Mensagem interna</option>
                  </select>
                </label>
              ) : (
                <input type="hidden" name="visibility" value="public" />
              )}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Mensagem</span>
                <textarea
                  name="body"
                  rows={5}
                  placeholder="Escreva uma atualizacao clara para o ticket."
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Anexos</span>
                <input
                  type="file"
                  name="attachments"
                  multiple
                  className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                />
                <span className="text-xs text-slate-500">Cada arquivo pode ter ate 50MB.</span>
              </label>

              <SubmitButton
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                pendingLabel="Enviando..."
              >
                Enviar mensagem
              </SubmitButton>
            </form>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Historico publico</h2>
                <p className="mt-1 text-sm text-slate-500">Mensagens visiveis para atendimento ao cliente.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {publicComments.length} mensagens
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {publicComments.length ? (
                publicComments.map((comment) => (
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
                    {comment.attachments.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.signed_url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-sky-700"
                          >
                            {attachment.file_name} · {formatFileSize(attachment.file_size)}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                  Ainda nao ha mensagens publicas neste ticket.
                </div>
              )}
            </div>
          </Card>

          {canUseInternalMessages ? (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Historico interno</h2>
                  <p className="mt-1 text-sm text-slate-500">Notas privadas para operacao e acompanhamento do time.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {internalComments.length} mensagens
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {internalComments.length ? (
                  internalComments.map((comment) => (
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
                        <Badge variant="status-progress">Interno</Badge>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {comment.body}
                      </p>
                      {comment.attachments.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {comment.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.signed_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-sky-700"
                            >
                              {attachment.file_name} · {formatFileSize(attachment.file_size)}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                    Ainda nao ha mensagens internas neste ticket.
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
