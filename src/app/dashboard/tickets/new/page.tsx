import Link from "next/link";

import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  buildProductTree,
  getCurrentUserProfile,
  getDomainCategories,
  getDomainProducts,
  getUserTicketDraft,
  getWorkspaceDepartmentsWithTeams,
  requireActiveWorkspace,
} from "@/lib/workspaces";

type NewTicketPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewTicketPage({ searchParams }: NewTicketPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const [profile, departmentsWithTeams, products, categories, draft] = await Promise.all([
    getCurrentUserProfile(),
    getWorkspaceDepartmentsWithTeams(activeMembership.workspace!.id),
    getDomainProducts(activeMembership.workspace!.domain_id),
    getDomainCategories(activeMembership.workspace!.domain_id),
    getUserTicketDraft(activeMembership.workspace!.id, user.id),
  ]);

  const productTree = buildProductTree(products);
  const currentTeam =
    departmentsWithTeams.flatMap((department) => department.teams).find((team) => team.id === profile.team_id) ??
    departmentsWithTeams[0]?.teams[0] ??
    null;
  const currentDepartment =
    departmentsWithTeams.find((department) => department.id === currentTeam?.department_id) ??
    departmentsWithTeams[0] ??
    null;

  if (!currentDepartment || !currentTeam || !productTree.length || !categories.length) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Tickets</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Criar novo ticket
          </h1>
        </header>

        <Card className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ainda faltam estruturas basicas do tenant para abrir tickets. Revise produtos, categorias e o time do usuario antes de continuar.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Tickets</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Criar novo ticket
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Abra um ticket com contexto completo, classificacao correta e rascunho persistido automaticamente.
          </p>
        </div>

        <Link
          href="/dashboard/tickets"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
        >
          Voltar para tickets
        </Link>
      </header>

      {params.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}

      <Card className="p-6">
        <NewTicketForm
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
          defaultCategoryId={draft?.category_id ?? categories[0].id}
          defaultProductId={draft?.product_id ?? productTree[0].id}
          defaultValues={{
            categoryId: draft?.category_id ?? categories[0].id,
            description: draft?.description ?? "",
            priority: draft?.priority ?? "medium",
            productId: draft?.product_id ?? productTree[0].id,
            title: draft?.title ?? "",
          }}
          departmentId={currentDepartment.id}
          products={productTree}
          teamId={currentTeam.id}
          userId={user.id}
          workspaceId={activeMembership.workspace!.id}
        />
      </Card>
    </section>
  );
}
