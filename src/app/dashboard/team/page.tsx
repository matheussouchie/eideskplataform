import { getWorkspaceMembers, requireActiveWorkspace } from "@/lib/workspaces";

export default async function TeamPage() {
  const activeMembership = await requireActiveWorkspace();
  const members = await getWorkspaceMembers(activeMembership.workspace!.id);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipe</p>
          <h1>Membros do workspace</h1>
          <p className="muted">Visibilidade de papéis por tenant.</p>
        </div>
      </header>

      <section className="card stack">
        {members.length ? (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Papel</th>
                  <th>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={`${member.user_id}-${member.created_at}`}>
                    <td>{member.profile?.full_name ?? member.user_id}</td>
                    <td>{member.role}</td>
                    <td>{new Date(member.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nenhum membro encontrado.</p>
        )}
      </section>
    </section>
  );
}
