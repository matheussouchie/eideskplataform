import { createTicketAction } from "@/app/actions/tickets";
import { SubmitButton } from "@/components/forms/submit-button";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ProductTreeSelect } from "@/components/tickets/product-tree-select";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  buildProductTree,
  getTicketsForDepartment,
  getTicketsForTeam,
  getTicketsForUser,
  getDomainCategories,
  getDomainProducts,
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
  const [allTickets, members, departmentsWithTeams, statuses, products, categories] = await Promise.all([
    getWorkspaceTicketsDetailed(activeMembership.workspace!.id),
    getWorkspaceMembers(activeMembership.workspace!.id),
    getWorkspaceDepartmentsWithTeams(activeMembership.workspace!.id),
    getWorkspaceTicketStatuses(activeMembership.workspace!.id),
    getDomainProducts(activeMembership.workspace!.domain_id),
    getDomainCategories(activeMembership.workspace!.domain_id),
  ]);
  const productTree = buildProductTree(products);

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
            {columns.map((column) => (
              <div key={column.status.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {column.status.name}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{column.tickets.length}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Meu time: {currentMember?.profile?.team_id
                ? departmentsWithTeams.flatMap((department) => department.teams).find((team) => team.id === currentMember.profile?.team_id)?.name ?? "Nao definido"
                : "Nao definido"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Meu departamento: {currentDepartmentId
                ? departmentsWithTeams.find((department) => department.id === currentDepartmentId)?.name ?? "Nao definido"
                : "Nao definido"}
            </span>
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
              <span className="text-sm font-medium text-slate-700">Departamento</span>
              <select
                name="departmentId"
                defaultValue={departmentsWithTeams[0]?.id}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                required
              >
                {departmentsWithTeams.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Time</span>
              <select
                name="teamId"
                defaultValue={departmentsWithTeams[0]?.teams[0]?.id}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                required
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
              <span className="text-sm font-medium text-slate-700">Produto</span>
              <ProductTreeSelect
                name="productId"
                products={productTree}
                defaultValue={productTree[0]?.id}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Categoria</span>
              <select
                name="categoryId"
                defaultValue={categories[0]?.id}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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

      <KanbanBoard columns={columns} canManageWorkflow={canManageWorkflow} />
    </section>
  );
}
