import { updateWorkspaceAction } from "@/app/actions/workspaces";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import { requireActiveWorkspace } from "@/lib/workspaces";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const activeMembership = await requireActiveWorkspace();
  const canEdit = ["owner", "admin"].includes(activeMembership.role);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Configurações</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Administração do tenant ativo.</p>
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

      <Card className="p-5">
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
              Salvar alterações
            </SubmitButton>
          ) : (
            <p className="text-sm text-slate-500">Somente owner ou admin podem editar este workspace.</p>
          )}
        </form>
      </Card>
    </section>
  );
}
