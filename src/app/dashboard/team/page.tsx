import { Card } from "@/components/ui/card";
import { getWorkspaceMembers, requireActiveWorkspace } from "@/lib/workspaces";

export default async function TeamPage() {
  const activeMembership = await requireActiveWorkspace();
  const members = await getWorkspaceMembers(activeMembership.workspace!.id);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
          Equipe
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Membros do workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Visibilidade de papeis por tenant.
        </p>
      </header>

      <Card className="overflow-hidden p-5">
        {members.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="pb-4 font-medium">Usuario</th>
                  <th className="pb-4 font-medium">Papel</th>
                  <th className="pb-4 font-medium">Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((member) => (
                  <tr key={`${member.user_id}-${member.created_at}`}>
                    <td className="py-4 font-medium text-slate-900 dark:text-slate-100">
                      {member.profile?.full_name ?? member.user_id}
                    </td>
                    <td className="py-4 capitalize text-slate-600 dark:text-slate-200">
                      {member.role}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-300">
                      {new Date(member.created_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">Nenhum membro encontrado.</p>
        )}
      </Card>
    </section>
  );
}
