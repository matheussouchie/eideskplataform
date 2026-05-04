import dynamic from "next/dynamic";

import { SkeletonKanban } from "@/components/skeletons/skeleton-kanban";
import { requireUser } from "@/lib/auth";
import {
  getWorkspaceDepartmentsWithTeams,
  getWorkspaceMembers,
  getWorkspaceTicketStatuses,
  getWorkspaceTicketsDetailed,
  requireActiveWorkspace,
} from "@/lib/workspaces";

const LazyTicketsBoardView = dynamic(
  () => import("@/components/tickets/tickets-board-view").then((module) => module.TicketsBoardView),
  {
    loading: () => <SkeletonKanban />,
  },
);

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
  const currentTeamName =
    currentMember?.profile?.team_id
      ? departmentsWithTeams
          .flatMap((department) => department.teams)
          .find((team) => team.id === currentMember.profile?.team_id)?.name ?? null
      : null;
  const currentDepartmentName = currentDepartmentId
    ? departmentsWithTeams.find((department) => department.id === currentDepartmentId)?.name ?? null
    : null;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Tickets</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Kanban operacional
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Visualizacao inspirada em Zendesk e Movidesk, com colunas focadas em fluxo, produtividade e acompanhamento do time.
        </p>
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

      <LazyTicketsBoardView
        allTickets={allTickets}
        canManageWorkflow={["owner", "admin", "agent"].includes(activeMembership.role)}
        currentDepartmentId={currentDepartmentId}
        currentDepartmentName={currentDepartmentName}
        currentTeamId={currentTeamId}
        currentTeamName={currentTeamName}
        initialQuery={params.query?.trim() ?? ""}
        initialScope={params.scope ?? "department"}
        statuses={statuses}
        userId={user.id}
      />
    </section>
  );
}
