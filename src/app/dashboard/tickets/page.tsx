import Link from "next/link";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  getTicketsForDepartment,
  getTicketsForTeam,
  getTicketsForUser,
  getWorkspaceDepartmentsWithTeams,
  getWorkspaceMembers,
  getWorkspaceTicketStatuses,
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
  const [allTickets, members, departmentsWithTeams, statuses] = await Promise.all([
    getWorkspaceTicketsDetailed(activeMembership.workspace!.id),
    getWorkspaceMembers(activeMembership.workspace!.id),
    getWorkspaceDepartmentsWithTeams(activeMembership.workspace!.id),
    getWorkspaceTicketStatuses(activeMembership.workspace!.id),
  ]);

  const currentMember = members.find((member) => member.user_id === user.id) ?? null;
  const currentTeamId = currentMember?.profile?.team_id ?? null;
  const currentDepartmentId =
    departmentsWithTeams.find((department) =>
      department.teams.some((team) => team.id === currentTeamId),
    )?.id ?? null;

  const query = params.query?.trim().toLowerCase() ?? "";
  const scope = params.scope ?? "department";

  const scopedTickets =
    scope === "mine"
      ? getTicketsForUser(allTickets, user.id)
      : scope === "team"
        ? getTicketsForTeam(allTickets, currentTeamId)
        : currentDepartmentId
          ? getTicketsForDepartment(allTickets, currentDepartmentId)
          : allTickets;

  const tickets = scopedTickets.filter((ticket) => {
    if (!query) {
      return true;
    }

    return [
      ticket.title,
      ticket.description,
      ticket.requester?.full_name,
      ticket.assignee?.full_name,
      ticket.priority,
      ticket.status_info?.name,
      ticket.team?.name,
      ticket.department?.name,
      ticket.product?.name,
      ticket.category?.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const canManageWorkflow = ["owner", "admin", "agent"].includes(activeMembership.role);
  const columns = statuses.map((status) => ({
    status,
    tickets: tickets.filter((ticket) => ticket.status_id === status.id),
  }));

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Tickets</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Kanban operacional
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Visualizacao inspirada em Zendesk e Movidesk, com colunas focadas em fluxo, produtividade e acompanhamento do time.
          </p>
        </div>

        <Link
          href="/dashboard/tickets/new"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,116,244,0.35)] transition hover:shadow-[0_16px_36px_rgba(14,116,244,0.42)]"
        >
          Adicionar ticket
        </Link>
      </header>

      {params.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {params.success}
        </p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
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
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
                      : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {columns.map((column) => (
              <div key={column.status.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {column.status.name}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{column.tickets.length}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              Meu time:{" "}
              {currentMember?.profile?.team_id
                ? departmentsWithTeams.flatMap((department) => department.teams).find((team) => team.id === currentMember.profile?.team_id)?.name ?? "Nao definido"
                : "Nao definido"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              Meu departamento:{" "}
              {currentDepartmentId
                ? departmentsWithTeams.find((department) => department.id === currentDepartmentId)?.name ?? "Nao definido"
                : "Nao definido"}
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nova experiencia de abertura</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A criacao agora acontece em uma tela dedicada, com rascunho automatico, protecao contra perda e classificacao completa.
            </p>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">O que voce ganha nesta sprint</p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• titulo e descricao com rascunho automatico</li>
              <li>• classificacao por produto, categoria e prioridade</li>
              <li>• alerta ao tentar sair com informacoes nao enviadas</li>
              <li>• encaminhamento automatico para a esteira do seu time</li>
            </ul>
          </div>

          <Link
            href="/dashboard/tickets/new"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
          >
            Abrir formulario completo
          </Link>
        </Card>
      </section>

      <KanbanBoard columns={columns} canManageWorkflow={canManageWorkflow} />
    </section>
  );
}
