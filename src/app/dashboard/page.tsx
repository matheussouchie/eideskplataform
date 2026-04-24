import Link from "next/link";

import { createWorkspaceAction } from "@/app/actions/workspaces";
import { SubmitButton } from "@/components/forms/submit-button";
import { getWorkspaceContext, getWorkspaceTickets } from "@/lib/workspaces";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { activeMembership } = await getWorkspaceContext();
  const tickets = activeMembership?.workspace ? await getWorkspaceTickets(activeMembership.workspace.id) : [];

  if (!activeMembership?.workspace) {
    return (
      <section className="stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">Onboarding</p>
            <h1>Crie o primeiro workspace</h1>
          </div>
        </header>

        {params.error ? <p className="alert error">{params.error}</p> : null}

        <form className="card stack" action={createWorkspaceAction}>
          <label className="field">
            <span>Nome do workspace</span>
            <input name="name" placeholder="EiDesk Operações" required />
          </label>
          <label className="field">
            <span>Slug</span>
            <input name="slug" placeholder="eidesk-operacoes" required />
          </label>
          <SubmitButton className="primary-button" pendingLabel="Criando workspace...">
            Criar workspace
          </SubmitButton>
        </form>
      </section>
    );
  }

  const openTickets = tickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status)).length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "resolved").length;

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{activeMembership.workspace.name}</h1>
          <p className="muted">Tenant ativo: {activeMembership.workspace.slug}</p>
        </div>
        <Link className="primary-button" href="/dashboard/tickets">
          Gerenciar tickets
        </Link>
      </header>

      {params.error ? <p className="alert error">{params.error}</p> : null}

      <section className="stats-grid">
        <article className="card">
          <p className="muted">Papel atual</p>
          <strong>{activeMembership.role}</strong>
        </article>
        <article className="card">
          <p className="muted">Tickets ativos</p>
          <strong>{openTickets}</strong>
        </article>
        <article className="card">
          <p className="muted">Tickets resolvidos</p>
          <strong>{resolvedTickets}</strong>
        </article>
      </section>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <h2>Fila recente</h2>
            <p className="muted">Os tickets mais novos do workspace ativo.</p>
          </div>
          <Link href="/dashboard/tickets">Abrir fila completa</Link>
        </div>

        {tickets.length ? (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 5).map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.title}</td>
                    <td>{ticket.status}</td>
                    <td>{ticket.priority}</td>
                    <td>{new Date(ticket.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nenhum ticket criado ainda.</p>
        )}
      </section>
    </section>
  );
}
