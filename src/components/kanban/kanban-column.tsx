import type { DragEvent, ReactNode } from "react";

import { TicketCard } from "@/components/kanban/ticket-card";
import type { TicketWithRelations } from "@/lib/workspaces";

type KanbanColumnProps = {
  title: string;
  tone: "blue" | "amber" | "violet" | "emerald";
  tickets: TicketWithRelations[];
  canAssume: boolean;
  isDropActive?: boolean;
  onDragLeaveColumn?: () => void;
  onDragOverColumn?: () => void;
  onDropTicket?: (event: DragEvent<HTMLElement>) => void;
  renderTicket?: (ticket: TicketWithRelations) => ReactNode;
};

const toneMap = {
  blue: "from-sky-500 to-blue-700",
  amber: "from-amber-400 to-orange-500",
  violet: "from-violet-500 to-fuchsia-600",
  emerald: "from-emerald-500 to-teal-600",
};

export function KanbanColumn({
  title,
  tone,
  tickets,
  canAssume,
  isDropActive = false,
  onDragLeaveColumn,
  onDragOverColumn,
  onDropTicket,
  renderTicket,
}: KanbanColumnProps) {
  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!onDragOverColumn) {
      return;
    }

    event.preventDefault();
    onDragOverColumn();
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!onDropTicket) {
      return;
    }

    event.preventDefault();
    onDropTicket(event);
  };

  return (
    <section
      onDragLeave={onDragLeaveColumn}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={
        isDropActive
          ? "flex w-[320px] shrink-0 flex-col rounded-[28px] border border-sky-300 bg-sky-50/70 p-3 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]"
          : "flex w-[320px] shrink-0 flex-col rounded-[28px] border border-slate-200 bg-slate-50/80 p-3"
      }
    >
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${toneMap[tone]}`} />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{tickets.length} tickets</p>
          </div>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-3 overflow-y-auto pr-1">
        {tickets.length ? (
          tickets.map((ticket) =>
            renderTicket ? (
              renderTicket(ticket)
            ) : (
              <TicketCard key={ticket.id} ticket={ticket} statusLabel={title} canAssume={canAssume} />
            ),
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            Nenhum ticket nesta etapa.
          </div>
        )}
      </div>
    </section>
  );
}
