import { TicketCard } from "@/components/kanban/ticket-card";
import type { TicketWithRelations } from "@/lib/workspaces";

type KanbanColumnProps = {
  title: string;
  tone: "blue" | "amber" | "violet" | "emerald";
  tickets: TicketWithRelations[];
  columnStatus: "novo" | "em-atendimento" | "aguardando-cliente" | "resolvido";
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
  columnStatus,
}: KanbanColumnProps) {
  return (
    <section className="flex w-[320px] shrink-0 flex-col rounded-[28px] border border-slate-200 bg-slate-50/80 p-3">
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
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} columnStatus={columnStatus} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            Nenhum ticket nesta etapa.
          </div>
        )}
      </div>
    </section>
  );
}
