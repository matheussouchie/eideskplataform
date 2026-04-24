import { updateWorkspaceAction } from "@/app/actions/workspaces";
import { SubmitButton } from "@/components/forms/submit-button";
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
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Workspace</h1>
          <p className="muted">Administração do tenant ativo.</p>
        </div>
      </header>

      {params.error ? <p className="alert error">{params.error}</p> : null}
      {params.success ? <p className="alert success">{params.success}</p> : null}

      <form className="card stack" action={updateWorkspaceAction}>
        <input type="hidden" name="workspaceId" value={activeMembership.workspace!.id} />
        <label className="field">
          <span>Nome</span>
          <input name="name" defaultValue={activeMembership.workspace!.name} disabled={!canEdit} required />
        </label>
        <label className="field">
          <span>Slug</span>
          <input name="slug" defaultValue={activeMembership.workspace!.slug} disabled={!canEdit} required />
        </label>
        {canEdit ? (
          <SubmitButton className="primary-button" pendingLabel="Atualizando...">
            Salvar alterações
          </SubmitButton>
        ) : (
          <p className="muted">Somente owner ou admin podem editar este workspace.</p>
        )}
      </form>
    </section>
  );
}
