import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TicketWithRelations } from "@/lib/workspaces";

function priorityVariant(priority: TicketWithRelations["priority"]) {
  switch (priority) {
    case "urgent":
      return "priority-urgent";
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    default:
      return "priority-low";
  }
}

function statusVariant(status: "novo" | "em-atendimento" | "aguardando-cliente" | "resolvido") {
  switch (status) {
    case "novo":
      return "status-open";
    case "em-atendimento":
      return "status-progress";
    case "aguardando-cliente":
      return "status-waiting";
    default:
      return "status-resolved";
  }
}

function statusLabel(status: "novo" | "em-atendimento" | "aguardando-cliente" | "resolvido") {
  switch (status) {
    case "novo":
      return "Novo";
    case "em-atendimento":
      return "Em atendimento";
    case "aguardando-cliente":
      return "Aguardando cliente";
    default:
      return "Resolvido";
  }
}

export function TicketCard({
  ticket,
  columnStatus,
}: {
  ticket: TicketWithRelations;
  columnStatus: "novo" | "em-atendimento" | "aguardando-cliente" | "resolvido";
}) {
  const requesterName = ticket.requester?.full_name ?? "Cliente nao identificado";

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`} className="block">
      <Card className="group border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_14px_28px_rgba(59,130,246,0.12)]">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                #{ticket.id.slice(-3)}
              </span>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                {ticket.title}
              </h3>
            </div>
            <div className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500 transition group-hover:scale-125" />
          </div>

          <p className="line-clamp-2 text-sm leading-5 text-slate-600">{ticket.description}</p>

          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{requesterName}</p>
            <p className="truncate">{ticket.assignee?.full_name ?? "Sem agente responsavel"}</p>
            <p className="mt-2 truncate text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {ticket.department?.name ?? "Departamento"} - {ticket.team?.name ?? "Time"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(columnStatus)}>{statusLabel(columnStatus)}</Badge>
            <Badge variant={priorityVariant(ticket.priority)}>
              {ticket.priority === "urgent"
                ? "Urgente"
                : ticket.priority === "high"
                  ? "Alta"
                  : ticket.priority === "medium"
                    ? "Media"
                    : "Baixa"}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
