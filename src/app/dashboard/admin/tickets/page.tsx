import { redirect } from "next/navigation";

import { repairTicketGovernanceAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getWorkspaceMembers,
  getWorkspaceDepartmentsWithTeams,
  getWorkspaceTicketGovernanceIssues,
  requireActiveWorkspace,
} from "@/lib/workspaces";

type AdminTicketsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function issueLabel(issue: string) {
  switch (issue) {
    case "missing-team":
      return "Sem time";
    case "missing-department":
      return "Sem departamento";
    case "team-mismatch":
      return "Time fora do departamento";
    default:
      return "Agente fora do time";
  }
}

export default async function AdminTicketsPage({ searchParams }: AdminTicketsPageProps) {
  const params = await searchParams;
  const activeMembership = await requireActiveWorkspace();

  if (!["owner", "admin"].includes(activeMembership.role)) {
    redirect("/dashboard?error=Sem+permissao+para+acessar+governanca");
  }

  const [issues, departmentsWithTeams, members] = await Promise.all([
    getWorkspaceTicketGovernanceIssues(activeMembership.workspace!.id),
    getWorkspaceDepartmentsWithTeams(activeMembership.workspace!.id),
    getWorkspaceMembers(activeMembership.workspace!.id),
  ]);

  const agents = members.filter((member) => ["owner", "admin", "agent"].includes(member.role));

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Gestao global de tickets
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Corrija filas desalinhadas, tickets sem responsavel coerente e inconsistencias de classificacao operacional.
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

      {!issues.length ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum ticket com problema de atribuicao foi encontrado neste workspace.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5">
          {issues.map((ticket) => (
            <Card key={`${ticket.id}-${ticket.assignment_issue}`} className="p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="priority-medium">#{ticket.id.slice(-3)}</Badge>
                    <Badge variant="status-waiting">{issueLabel(ticket.assignment_issue)}</Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{ticket.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-white">Departamento atual:</span>{" "}
                      {ticket.department?.name ?? "Nao definido"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-white">Time atual:</span>{" "}
                      {ticket.team?.name ?? "Nao definido"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-white">Responsavel atual:</span>{" "}
                      {ticket.assignee?.full_name ?? "Sem responsavel"}
                    </p>
                  </div>
                </div>

                <form action={repairTicketGovernanceAction} className="grid w-full gap-3 xl:max-w-xl">
                  <input type="hidden" name="ticketId" value={ticket.id} />

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Departamento</span>
                    <select
                      name="departmentId"
                      defaultValue={ticket.department_id}
                      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {departmentsWithTeams.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Time</span>
                    <select
                      name="teamId"
                      defaultValue={ticket.team_id}
                      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {departmentsWithTeams.flatMap((department) =>
                        department.teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {department.name} - {team.name}
                          </option>
                        )),
                      )}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Agente</span>
                    <select
                      name="assignedTo"
                      defaultValue={ticket.assigned_to ?? ""}
                      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Sem responsavel</option>
                      {agents.map((agent) => (
                        <option key={agent.user_id} value={agent.user_id}>
                          {agent.profile?.full_name ?? agent.user_id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <SubmitButton
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                    pendingLabel="Aplicando..."
                  >
                    Aplicar correcao
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
