import {
  archiveAgentAction,
  createAgentAction,
  createCategoryAction,
  createDepartmentAction,
  createProductAction,
  createTeamAction,
  deleteCategoryAction,
  deleteDepartmentAction,
  deleteProductAction,
  deleteTeamAction,
  updateAgentAction,
  updateCategoryAction,
  updateDepartmentAction,
  updateProductAction,
  updateTeamAction,
} from "@/app/actions/admin";
import { updateWorkspaceAction } from "@/app/actions/workspaces";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import {
  getDomainCategories,
  getDomainProducts,
  getWorkspaceDepartmentsWithTeams,
  getWorkspaceMembers,
  requireActiveWorkspace,
} from "@/lib/workspaces";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    panel?: string;
    success?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const activeMembership = await requireActiveWorkspace();
  const canEdit = ["owner", "admin"].includes(activeMembership.role);

  const [members, departmentsWithTeams, products, categories] = canEdit
    ? await Promise.all([
        getWorkspaceMembers(activeMembership.workspace!.id),
        getWorkspaceDepartmentsWithTeams(activeMembership.workspace!.id),
        getDomainProducts(activeMembership.workspace!.domain_id),
        getDomainCategories(activeMembership.workspace!.domain_id),
      ])
    : [[], [], [], []];

  const agents = members.filter((member) => member.role === "agent");
  const productNameById = new Map(products.map((product) => [product.id, product.name]));

  const navItems = [
    { id: "workspace", label: "Workspace" },
    { id: "agents", label: "Agentes" },
    { id: "products", label: "Produtos" },
    { id: "categories", label: "Categorias" },
    { id: "departments", label: "Departamentos" },
    { id: "teams", label: "Times" },
    { id: "governanca", label: "Governanca" },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Configuracoes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Painel admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Controle operacional do tenant ativo, com CRUDs e protecoes de administracao.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={
                params.panel === item.id
                  ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              }
            >
              {item.label}
            </a>
          ))}
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

      <Card className="border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950" id="workspace">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Administracao base do tenant atual.</p>
        </div>

        <form className="grid gap-4" action={updateWorkspaceAction}>
          <input type="hidden" name="workspaceId" value={activeMembership.workspace!.id} />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              name="name"
              defaultValue={activeMembership.workspace!.name}
              disabled={!canEdit}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Slug</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              name="slug"
              defaultValue={activeMembership.workspace!.slug}
              disabled={!canEdit}
              required
            />
          </label>
          {canEdit ? (
            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              pendingLabel="Atualizando..."
            >
              Salvar alteracoes
            </SubmitButton>
          ) : (
            <p className="text-sm text-slate-500">Somente owner ou admin podem editar este workspace.</p>
          )}
        </form>
      </Card>

      {canEdit ? (
        <>
          <Card className="border-blue-200 bg-blue-50/55 p-5 dark:border-blue-500/20 dark:bg-blue-500/5" id="agents">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Agentes</h2>
              <p className="mt-1 text-sm text-slate-500">Criacao, edicao e arquivamento de agentes do workspace.</p>
            </div>

            <form className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-4" action={createAgentAction}>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700">Nome</span>
                <input name="fullName" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input name="email" type="email" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700">Senha inicial</span>
                <input name="password" type="password" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700">Time</span>
                <select name="teamId" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required>
                  {departmentsWithTeams.flatMap((department) =>
                    department.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {department.name} - {team.name}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <div className="xl:col-span-4">
                <SubmitButton
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  pendingLabel="Criando agente..."
                >
                  Criar agente
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {agents.map((agent) => (
                <div key={agent.user_id} className="rounded-3xl border border-slate-200 p-4">
                  <form className="grid gap-3 xl:grid-cols-[1.1fr_1fr_auto_auto]" action={updateAgentAction}>
                    <input type="hidden" name="agentUserId" value={agent.user_id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nome</span>
                      <input
                        name="fullName"
                        defaultValue={agent.profile?.full_name ?? ""}
                        className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400"
                        required
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Time</span>
                      <select
                        name="teamId"
                        defaultValue={agent.profile?.team_id ?? undefined}
                        className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400"
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
                    <label className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input type="checkbox" name="isActive" defaultChecked={agent.profile?.is_active ?? false} />
                      <span className="text-sm font-medium text-slate-700">Ativo</span>
                    </label>
                    <div className="flex items-end gap-2">
                      <SubmitButton
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        pendingLabel="Salvando..."
                      >
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{agent.profile?.is_active ? "Agente ativo" : "Agente inativo"}</span>
                    <form action={archiveAgentAction}>
                      <input type="hidden" name="agentUserId" value={agent.user_id} />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Arquivar agente
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-rose-200 bg-rose-50/55 p-5 dark:border-rose-500/20 dark:bg-rose-500/5" id="products">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Produtos</h2>
              <p className="mt-1 text-sm text-slate-500">Estrutura hierarquica de classificacao do ticket.</p>
            </div>

            <form className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_1fr_auto]" action={createProductAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nome do produto</span>
                <input name="name" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Produto pai</span>
                <select name="parentId" defaultValue="" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400">
                  <option value="">Sem pai</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <SubmitButton
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  pendingLabel="Criando..."
                >
                  Criar produto
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 p-4">
                  <form className="grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]" action={updateProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nome</span>
                      <input name="name" defaultValue={product.name} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400" required />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pai</span>
                      <select name="parentId" defaultValue={product.parent_id ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400">
                        <option value="">Sem pai</option>
                        {products
                          .filter((candidate) => candidate.id !== product.id)
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span>Pai atual: {product.parent_id ? productNameById.get(product.parent_id) ?? "Nao encontrado" : "Raiz"}</span>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/55 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5" id="categories">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Categorias</h2>
              <p className="mt-1 text-sm text-slate-500">Classificacao plana para o contexto do ticket.</p>
            </div>

            <form className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]" action={createCategoryAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nome da categoria</span>
                <input name="name" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <div className="flex items-end">
                <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Criar categoria
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {categories.map((category) => (
                <div key={category.id} className="rounded-3xl border border-slate-200 p-4">
                  <form className="grid gap-3 xl:grid-cols-[1fr_auto_auto]" action={updateCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nome</span>
                      <input name="name" defaultValue={category.name} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400" required />
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>
                  <div className="mt-3 flex justify-end">
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <button type="submit" className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-amber-200 bg-amber-50/55 p-5 dark:border-amber-500/20 dark:bg-amber-500/5" id="departments">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Departamentos</h2>
              <p className="mt-1 text-sm text-slate-500">Estrutura macro do atendimento.</p>
            </div>

            <form className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_auto]" action={createDepartmentAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nome do departamento</span>
                <input name="name" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <div className="flex items-end">
                <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Criar departamento
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {departmentsWithTeams.map((department) => (
                <div key={department.id} className="rounded-3xl border border-slate-200 p-4">
                  <form className="grid gap-3 xl:grid-cols-[1fr_auto]" action={updateDepartmentAction}>
                    <input type="hidden" name="departmentId" value={department.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nome</span>
                      <input name="name" defaultValue={department.name} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400" required />
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{department.teams.length} times vinculados</span>
                    <form action={deleteDepartmentAction}>
                      <input type="hidden" name="departmentId" value={department.id} />
                      <button type="submit" className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-violet-200 bg-violet-50/55 p-5 dark:border-violet-500/20 dark:bg-violet-500/5" id="teams">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Times</h2>
              <p className="mt-1 text-sm text-slate-500">Unidades operacionais vinculadas a departamentos.</p>
            </div>

            <form className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_1fr_auto]" action={createTeamAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nome do time</span>
                <input name="name" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Departamento</span>
                <select name="departmentId" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-sky-400" required>
                  {departmentsWithTeams.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Criar time
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {departmentsWithTeams.flatMap((department) =>
                department.teams.map((team) => (
                  <div key={team.id} className="rounded-3xl border border-slate-200 p-4">
                    <form className="grid gap-3 xl:grid-cols-[1fr_1fr_auto]" action={updateTeamAction}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nome</span>
                        <input name="name" defaultValue={team.name} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400" required />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Departamento</span>
                        <select name="departmentId" defaultValue={team.department_id} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-sky-400" required>
                          {departmentsWithTeams.map((departmentOption) => (
                            <option key={departmentOption.id} value={departmentOption.id}>
                              {departmentOption.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-end">
                        <SubmitButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                          Salvar
                        </SubmitButton>
                      </div>
                    </form>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                      <span>Departamento atual: {department.name}</span>
                      <form action={deleteTeamAction}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <button type="submit" className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                          Remover
                        </button>
                      </form>
                    </div>
                  </div>
                )),
              )}
            </div>
          </Card>

          <Card className="border-sky-200 bg-sky-50/55 p-5 dark:border-sky-500/20 dark:bg-sky-500/5" id="governanca">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Governanca de tickets</h2>
              <p className="mt-1 text-sm text-slate-500">Acesse a triagem global para corrigir tickets desalinhados.</p>
            </div>

            <a
              href="/dashboard/admin/tickets"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir gestao global de tickets
            </a>
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            O painel admin completo desta sprint esta disponivel apenas para owner e admin.
          </p>
        </Card>
      )}
    </section>
  );
}
