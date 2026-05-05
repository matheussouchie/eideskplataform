import {
  addWorkspaceMemberAction,
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
  const sectionCardClass = "border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950";
  const panelClass = "grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60";
  const itemClass = "rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/80";
  const fieldClass =
    "h-11 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 dark:border-[#2A2F3A] dark:bg-[#0B0F1A] dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-sky-500 dark:focus:bg-[#0B0F1A]";
  const workspaceFieldClass =
    "h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-[#2A2F3A] dark:bg-[#0B0F1A] dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-sky-500 dark:focus:bg-[#0B0F1A] dark:disabled:bg-slate-900";
  const primaryButtonClass =
    "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Configuracoes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Painel admin</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
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
                  ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
                  : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            >
              {item.label}
            </a>
          ))}
        </div>
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

      <Card className={sectionCardClass} id="workspace">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Workspace</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Administracao base do tenant atual.</p>
        </div>

        <form className="grid gap-4" action={updateWorkspaceAction}>
          <input type="hidden" name="workspaceId" value={activeMembership.workspace!.id} />
          <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome</span>
            <input
              className={workspaceFieldClass}
              name="name"
              defaultValue={activeMembership.workspace!.name}
              disabled={!canEdit}
              required
            />
          </label>
          <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Slug</span>
            <input
              className={workspaceFieldClass}
              name="slug"
              defaultValue={activeMembership.workspace!.slug}
              disabled={!canEdit}
              required
            />
          </label>
          {canEdit ? (
            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
              pendingLabel="Atualizando..."
            >
              Salvar alteracoes
            </SubmitButton>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Somente owner ou admin podem editar este workspace.</p>
          )}
        </form>

        {canEdit ? (
          <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Adicionar membro por email</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Inclua usuarios existentes neste workspace com o papel operacional correto.
              </p>
            </div>

            <form className="grid gap-3 xl:grid-cols-[1.5fr_0.7fr_auto]" action={addWorkspaceMemberAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Email do usuario</span>
                <input
                  name="email"
                  type="email"
                  className={workspaceFieldClass}
                  placeholder="usuario@empresa.com"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Role</span>
                <select name="role" defaultValue="agent" className={workspaceFieldClass}>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="requester">Requester</option>
                </select>
              </label>
              <div className="flex items-end">
                <SubmitButton
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 xl:w-auto"
                  pendingLabel="Adicionando..."
                >
                  Adicionar membro
                </SubmitButton>
              </div>
            </form>

            <div className="grid gap-3">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-[#2A2F3A] dark:bg-[#0B0F1A]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {member.profile?.full_name ?? "Usuario sem nome"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Entrada em {new Date(member.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {canEdit ? (
        <>
          <Card className={sectionCardClass} id="agents">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Agentes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Criacao, edicao e arquivamento de agentes do workspace.</p>
            </div>

            <form className={`${panelClass} xl:grid-cols-4`} action={createAgentAction}>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome</span>
                <input name="fullName" className={fieldClass} required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Email</span>
                <input name="email" type="email" className={fieldClass} required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Senha inicial</span>
                <input name="password" type="password" className={fieldClass} required />
              </label>
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Time</span>
                <select name="teamId" className={fieldClass} required>
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
                  className={primaryButtonClass}
                  pendingLabel="Criando agente..."
                >
                  Criar agente
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {agents.map((agent) => (
                <div key={agent.user_id} className={itemClass}>
                  <form className="grid gap-3 xl:grid-cols-[1.1fr_1fr_auto_auto]" action={updateAgentAction}>
                    <input type="hidden" name="agentUserId" value={agent.user_id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nome</span>
                      <input
                        name="fullName"
                        defaultValue={agent.profile?.full_name ?? ""}
                        className={fieldClass}
                        required
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Time</span>
                      <select
                        name="teamId"
                        defaultValue={agent.profile?.team_id ?? undefined}
                        className={fieldClass}
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
                    <label className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#2A2F3A] dark:bg-[#0B0F1A]">
                      <input type="checkbox" name="isActive" defaultChecked={agent.profile?.is_active ?? false} />
                      <span className="text-sm font-medium text-slate-700 dark:text-white">Ativo</span>
                    </label>
                    <div className="flex items-end gap-2">
                      <SubmitButton
                        className={primaryButtonClass}
                        pendingLabel="Salvando..."
                      >
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
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

          <Card className={sectionCardClass} id="products">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Produtos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Estrutura hierarquica de classificacao do ticket.</p>
            </div>

            <form className={`${panelClass} xl:grid-cols-[1fr_1fr_auto]`} action={createProductAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome do produto</span>
                <input name="name" className={fieldClass} required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Produto pai</span>
                <select name="parentId" defaultValue="" className={fieldClass}>
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
                  className={primaryButtonClass}
                  pendingLabel="Criando..."
                >
                  Criar produto
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {products.map((product) => (
                <div key={product.id} className={itemClass}>
                  <form className="grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]" action={updateProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nome</span>
                      <input name="name" defaultValue={product.name} className={fieldClass} required />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Pai</span>
                      <select name="parentId" defaultValue={product.parent_id ?? ""} className={fieldClass}>
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
                      <SubmitButton className={primaryButtonClass}>
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
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

          <Card className={sectionCardClass} id="categories">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Categorias</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Classificacao plana para o contexto do ticket.</p>
            </div>

            <form className={`${panelClass} xl:grid-cols-[1fr_auto]`} action={createCategoryAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome da categoria</span>
                <input name="name" className={fieldClass} required />
              </label>
              <div className="flex items-end">
                <SubmitButton className={primaryButtonClass}>
                  Criar categoria
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {categories.map((category) => (
                <div key={category.id} className={itemClass}>
                  <form className="grid gap-3 xl:grid-cols-[1fr_auto_auto]" action={updateCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nome</span>
                      <input name="name" defaultValue={category.name} className={fieldClass} required />
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className={primaryButtonClass}>
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

          <Card className={sectionCardClass} id="departments">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Departamentos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Estrutura macro do atendimento.</p>
            </div>

            <form className={`${panelClass} xl:grid-cols-[1fr_auto]`} action={createDepartmentAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome do departamento</span>
                <input name="name" className={fieldClass} required />
              </label>
              <div className="flex items-end">
                <SubmitButton className={primaryButtonClass}>
                  Criar departamento
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {departmentsWithTeams.map((department) => (
                <div key={department.id} className={itemClass}>
                  <form className="grid gap-3 xl:grid-cols-[1fr_auto]" action={updateDepartmentAction}>
                    <input type="hidden" name="departmentId" value={department.id} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nome</span>
                      <input name="name" defaultValue={department.name} className={fieldClass} required />
                    </label>
                    <div className="flex items-end">
                      <SubmitButton className={primaryButtonClass}>
                        Salvar
                      </SubmitButton>
                    </div>
                  </form>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
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

          <Card className={sectionCardClass} id="teams">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Times</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Unidades operacionais vinculadas a departamentos.</p>
            </div>

            <form className={`${panelClass} xl:grid-cols-[1fr_1fr_auto]`} action={createTeamAction}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Nome do time</span>
                <input name="name" className={fieldClass} required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Departamento</span>
                <select name="departmentId" className={fieldClass} required>
                  {departmentsWithTeams.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <SubmitButton className={primaryButtonClass}>
                  Criar time
                </SubmitButton>
              </div>
            </form>

            <div className="mt-5 grid gap-4">
              {departmentsWithTeams.flatMap((department) =>
                department.teams.map((team) => (
                  <div key={team.id} className={itemClass}>
                    <form className="grid gap-3 xl:grid-cols-[1fr_1fr_auto]" action={updateTeamAction}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nome</span>
                        <input name="name" defaultValue={team.name} className={fieldClass} required />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Departamento</span>
                        <select name="departmentId" defaultValue={team.department_id} className={fieldClass} required>
                          {departmentsWithTeams.map((departmentOption) => (
                            <option key={departmentOption.id} value={departmentOption.id}>
                              {departmentOption.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-end">
                        <SubmitButton className={primaryButtonClass}>
                          Salvar
                        </SubmitButton>
                      </div>
                    </form>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
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

          <Card className={sectionCardClass} id="governanca">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Governanca de tickets</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">Acesse a triagem global para corrigir tickets desalinhados.</p>
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            O painel admin completo desta sprint esta disponivel apenas para owner e admin.
          </p>
        </Card>
      )}
    </section>
  );
}
