import Link from "next/link";

import { assumeTicketAction } from "@/app/actions/tickets";
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

function statusVariant(statusName: string) {
  const normalized = statusName.trim().toLowerCase();

  if (normalized.includes("atendimento")) {
    return "status-progress" as const;
  }

  if (normalized.includes("aguardando")) {
    return "status-waiting" as const;
  }

  if (normalized.includes("resolvido") || normalized.includes("fechado")) {
    return "status-resolved" as const;
  }

  return "status-open" as const;
}

export function TicketCard({
  ticket,
  statusLabel,
  canAssume,
}: {
  ticket: TicketWithRelations;
  statusLabel: string;
  canAssume: boolean;
}) {
  const requesterName = ticket.requester?.full_name ?? "Cliente nao identificado";
  const responsibleName = ticket.assignee?.full_name ?? "Sem responsavel";

  return (
    <Card className="border-slate-200 bg-white p-4 transition duration-200 hover:border-sky-300 hover:shadow-[0_14px_28px_rgba(59,130,246,0.12)]">
      <div className="space-y-4">
        <Link href={`/dashboard/tickets/${ticket.id}`} className="group block">
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
            <p className="truncate">Responsavel: {responsibleName}</p>
            <p className="mt-2 truncate text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {ticket.department?.name ?? "Departamento"} - {ticket.team?.name ?? "Time"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {ticket.product?.name ?? "Produto"} / {ticket.category?.name ?? "Categoria"}
            </p>
          </div>
          </div>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant(statusLabel)}>{statusLabel}</Badge>
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

        {canAssume && !ticket.assigned_to ? (
          <form action={assumeTicketAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Assumir ticket
            </button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
