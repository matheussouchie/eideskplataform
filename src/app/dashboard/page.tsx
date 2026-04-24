import Link from "next/link";

import { createWorkspaceAction } from "@/app/actions/workspaces";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  getTicketsForDepartment,
  getTicketsForTeam,
  getTicketsForUser,
  getWorkspaceDepartmentsWithTeams,
  getWorkspaceContext,
  getWorkspaceMembers,
  getWorkspaceTicketsDetailed,
} from "@/lib/workspaces";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const { activeMembership } = await getWorkspaceContext();
  const workspaceId = activeMembership?.workspace?.id;
  let tickets = [] as Awaited<ReturnType<typeof getWorkspaceTicketsDetailed>>;
  let workspaceMembers = [] as Awaited<ReturnType<typeof getWorkspaceMembers>>;
  let departmentsWithTeams = [] as Awaited<ReturnType<typeof getWorkspaceDepartmentsWithTeams>>;

  if (workspaceId) {
    [tickets, workspaceMembers, departmentsWithTeams] = await Promise.all([
      getWorkspaceTicketsDetailed(workspaceId),
      getWorkspaceMembers(workspaceId),
      getWorkspaceDepartmentsWithTeams(workspaceId),
    ]);
  }

  if (!activeMembership?.workspace) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Onboarding</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Crie o primeiro workspace
          </h1>
        </header>

        {params.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </p>
        ) : null}

        <form
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          action={createWorkspaceAction}
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nome do workspace</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
              name="name"
              placeholder="EiDesk Operações"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Slug</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
              name="slug"
              placeholder="eidesk-operacoes"
              required
            />
          </label>
          <SubmitButton
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            pendingLabel="Criando workspace..."
          >
            Criar workspace
          </SubmitButton>
        </form>
      </section>
    );
  }

  const currentMember = workspaceMembers.find((member) => member.user_id === user.id) ?? null;
  const currentTeamId = currentMember?.profile?.team_id ?? null;
  const currentDepartmentId =
    departmentsWithTeams.find((department) =>
      department.teams.some((team) => team.id === currentTeamId),
    )?.id ?? null;

  const myTickets = getTicketsForUser(tickets, user.id);
  const teamTickets = getTicketsForTeam(tickets, currentTeamId);
  const departmentTickets = currentDepartmentId
    ? getTicketsForDepartment(tickets, currentDepartmentId)
    : tickets;
  const activeTeamMembers = currentTeamId
    ? workspaceMembers.filter((member) => member.profile?.team_id === currentTeamId)
    : [];

  const buildBreakdown = (sourceTickets: typeof tickets) => ({
    open: sourceTickets.filter((ticket) => ticket.status === "open" && !ticket.assignee_id).length,
    progress: sourceTickets.filter((ticket) => ticket.status === "in_progress").length,
    waiting: sourceTickets.filter((ticket) => ticket.status === "open" && Boolean(ticket.assignee_id)).length,
    resolved: sourceTickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status)).length,
  });

  const myBreakdown = buildBreakdown(myTickets);
  const teamBreakdown = buildBreakdown(teamTickets);
  const departmentBreakdown = buildBreakdown(departmentTickets);
  const firstName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.split(" ")[0]) ||
    "time";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Olá, {firstName}.
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Visualize a operação do workspace, acompanhe sua fila e navegue rapidamente para o
            kanban filtrado por contexto.
          </p>
        </div>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/dashboard/tickets"
        >
          Abrir kanban
        </Link>
      </header>

      {params.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-3">
        <MetricCard
          href="/dashboard/tickets?scope=mine"
          label="Meus Tickets"
          total={myTickets.length}
          subtitle="Fila pessoal para acompanhar o que está sob sua responsabilidade."
          breakdown={[
            { label: "Novos", value: myBreakdown.open },
            { label: "Em atendimento", value: myBreakdown.progress },
            { label: "Aguardando cliente", value: myBreakdown.waiting },
            { label: "Resolvidos", value: myBreakdown.resolved },
          ]}
        />
        <MetricCard
          href="/dashboard/tickets?scope=team"
          label="Tickets do Time"
          total={teamTickets.length}
          subtitle="Visão compartilhada da fila operacional dos agentes e administradores."
          breakdown={[
            { label: "Novos", value: teamBreakdown.open },
            { label: "Em atendimento", value: teamBreakdown.progress },
            { label: "Aguardando cliente", value: teamBreakdown.waiting },
            { label: "Resolvidos", value: teamBreakdown.resolved },
          ]}
          accent="slate"
        />
        <MetricCard
          href="/dashboard/tickets?scope=department"
          label="Tickets do Departamento"
          total={departmentTickets.length}
          subtitle="Panorama completo do workspace com backlog, atendimento e encerramentos."
          breakdown={[
            { label: "Novos", value: departmentBreakdown.open },
            { label: "Em atendimento", value: departmentBreakdown.progress },
            { label: "Aguardando cliente", value: departmentBreakdown.waiting },
            { label: "Resolvidos", value: departmentBreakdown.resolved },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Fluxo recente</p>
              <p className="mt-1 text-sm text-slate-500">
                Últimos tickets com contexto de cliente, prioridade e responsável.
              </p>
            </div>
            <Link href="/dashboard/tickets" className="text-sm font-semibold text-sky-700">
              Ver kanban
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    #{ticket.id.slice(-3)} · {ticket.requester?.full_name ?? "Cliente"}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{ticket.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.assignee?.full_name ?? "Sem responsável"} ·{" "}
                    {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-sky-700"
                >
                  Abrir ticket
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Resumo do workspace</p>
            <p className="mt-1 text-sm text-slate-500">
              Tenant ativo, papel atual e capacidade de atendimento desta sprint.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{activeMembership.workspace.name}</p>
              <p className="mt-1 text-sm text-slate-500">{activeMembership.workspace.slug}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Seu papel</p>
              <p className="mt-2 text-base font-semibold capitalize text-slate-900">{activeMembership.role}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Equipe ativa</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{activeTeamMembers.length} pessoas</p>
              <p className="mt-1 text-sm text-slate-500">
                {workspaceMembers.filter((member) => member.role === "requester").length} clientes com acesso
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estrutura atual</p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {currentMember?.profile?.team_id
                  ? departmentsWithTeams.flatMap((department) => department.teams).find((team) => team.id === currentMember.profile?.team_id)?.name ?? "Time nao definido"
                  : "Time nao definido"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {currentDepartmentId
                  ? departmentsWithTeams.find((department) => department.id === currentDepartmentId)?.name ?? "Departamento nao definido"
                  : "Departamento nao definido"}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </section>
  );
}
