import { createTicketAction } from "@/app/actions/tickets";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  getWorkspaceMembers,
  getWorkspaceTicketsDetailed,
  requireActiveWorkspace,
} from "@/lib/workspaces";

type TicketsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    scope?: string;
    query?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const allTickets = await getWorkspaceTicketsDetailed(activeMembership.workspace!.id);
  const members = await getWorkspaceMembers(activeMembership.workspace!.id);

  const teamIds = members
    .filter((member) => ["owner", "admin", "agent"].includes(member.role))
    .map((member) => member.user_id);

  const query = params.query?.trim().toLowerCase() ?? "";
  const scope = params.scope ?? "department";

  const scopedTickets = allTickets.filter((ticket) => {
    if (scope === "mine") {
      return ticket.assignee_id === user.id || ticket.requester_id === user.id;
    }

    if (scope === "team") {
      return (ticket.assignee_id ? teamIds.includes(ticket.assignee_id) : false) || !ticket.assignee_id;
    }

    return true;
  });

  const tickets = scopedTickets.filter((ticket) => {
    if (!query) {
      return true;
    }

    return [ticket.title, ticket.description, ticket.requester?.full_name, ticket.assignee?.full_name, ticket.priority]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const columns = {
    novo: tickets.filter((ticket) => ticket.status === "open" && !ticket.assignee_id),
    atendimento: tickets.filter((ticket) => ticket.status === "in_progress"),
    aguardando: tickets.filter((ticket) => ticket.status === "open" && Boolean(ticket.assignee_id)),
    resolvido: tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status)),
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Tickets</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Kanban operacional
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Visualização inspirada em Zendesk e Movidesk, com colunas focadas em fluxo e produtividade.
          </p>
        </div>
      </header>

      {params.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: "mine", label: "Meus Tickets" },
              { id: "team", label: "Tickets do Time" },
              { id: "department", label: "Tickets do Departamento" },
            ].map((item) => {
              const active = scope === item.id;
              const href = `/dashboard/tickets?scope=${item.id}${query ? `&query=${encodeURIComponent(query)}` : ""}`;

              return (
                <a
                  key={item.id}
                  href={href}
                  className={
                    active
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Novo</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{columns.novo.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Em atendimento</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{columns.atendimento.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Aguardando cliente</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{columns.aguardando.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Resolvido</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{columns.resolvido.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Novo ticket</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mantido para compatibilidade com a Sprint 1.
            </p>
          </div>

          <form className="mt-5 grid gap-3" action={createTicketAction}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Título</span>
              <input
                name="title"
                placeholder="Ex: Erro ao acessar dashboard"
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Descrição</span>
              <textarea
                name="description"
                rows={4}
                placeholder="Descreva o problema, impacto e contexto."
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Prioridade</span>
              <select
                name="priority"
                defaultValue="medium"
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <SubmitButton
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              pendingLabel="Criando ticket..."
            >
              Criar ticket
            </SubmitButton>
          </form>
        </Card>
      </section>

      <section className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          <KanbanColumn title="Novo" tone="blue" tickets={columns.novo} columnStatus="novo" />
          <KanbanColumn
            title="Em atendimento"
            tone="amber"
            tickets={columns.atendimento}
            columnStatus="em-atendimento"
          />
          <KanbanColumn
            title="Aguardando cliente"
            tone="violet"
            tickets={columns.aguardando}
            columnStatus="aguardando-cliente"
          />
          <KanbanColumn
            title="Resolvido"
            tone="emerald"
            tickets={columns.resolvido}
            columnStatus="resolvido"
          />
        </div>
      </section>
    </section>
  );
}
