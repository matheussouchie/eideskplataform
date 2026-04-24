import { createTicketAction, updateTicketStatusAction } from "@/app/actions/tickets";
import { TicketStatusBadge } from "@/components/dashboard/ticket-status-badge";
import { SubmitButton } from "@/components/forms/submit-button";
import { requireActiveWorkspace, getWorkspaceTickets } from "@/lib/workspaces";

type TicketsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const activeMembership = await requireActiveWorkspace();
  const tickets = await getWorkspaceTickets(activeMembership.workspace!.id);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tickets</p>
          <h1>Fila do workspace</h1>
          <p className="muted">{activeMembership.workspace!.name}</p>
        </div>
      </header>

      {params.error ? <p className="alert error">{params.error}</p> : null}
      {params.success ? <p className="alert success">{params.success}</p> : null}

      <section className="content-grid">
        <form className="card stack" action={createTicketAction}>
          <div>
            <h2>Novo ticket</h2>
            <p className="muted">Crie solicitações sem sair do workspace atual.</p>
          </div>
          <label className="field">
            <span>Título</span>
            <input name="title" placeholder="Erro ao acessar dashboard" required />
          </label>
          <label className="field">
            <span>Descrição</span>
            <textarea
              name="description"
              placeholder="Descreva o problema, impacto e contexto operacional."
              rows={5}
              required
            />
          </label>
          <label className="field">
            <span>Prioridade</span>
            <select name="priority" defaultValue="medium">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>
          <SubmitButton className="primary-button" pendingLabel="Criando ticket...">
            Criar ticket
          </SubmitButton>
        </form>

        <section className="card stack">
          <div>
            <h2>Fila completa</h2>
            <p className="muted">Todos os tickets visíveis dentro do tenant ativo.</p>
          </div>

          {tickets.length ? (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div>
                      <h3>{ticket.title}</h3>
                      <p className="muted">{ticket.description}</p>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>

                  <div className="ticket-meta">
                    <span>Prioridade: {ticket.priority}</span>
                    <span>Criado em {new Date(ticket.created_at).toLocaleString("pt-BR")}</span>
                  </div>

                  {["owner", "admin", "agent"].includes(activeMembership.role) ? (
                    <form className="inline-form" action={updateTicketStatusAction}>
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <select name="status" defaultValue={ticket.status}>
                        <option value="open">Aberto</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="resolved">Resolvido</option>
                        <option value="closed">Fechado</option>
                      </select>
                      <SubmitButton className="secondary-button" pendingLabel="Salvando...">
                        Atualizar status
                      </SubmitButton>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Sem tickets no workspace.</p>
          )}
        </section>
      </section>
    </section>
  );
}
