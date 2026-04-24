"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { moveTicketStatusAction } from "@/app/actions/tickets";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TicketCard } from "@/components/kanban/ticket-card";
import type { TicketStatusWithMeta, TicketWithRelations } from "@/lib/workspaces";

type KanbanBoardProps = {
  canManageWorkflow: boolean;
  columns: Array<{
    status: TicketStatusWithMeta;
    tickets: TicketWithRelations[];
  }>;
};

function moveTicketBetweenColumns(
  columns: KanbanBoardProps["columns"],
  ticketId: string,
  targetStatusId: string,
) {
  let ticketToMove: TicketWithRelations | null = null;

  const nextColumns = columns.map((column) => {
    const remainingTickets = column.tickets.filter((ticket) => {
      if (ticket.id === ticketId) {
        ticketToMove = {
          ...ticket,
          status_id: targetStatusId,
          status_info: {
            id: targetStatusId,
            name: columns.find((item) => item.status.id === targetStatusId)?.status.name ?? ticket.status_info?.name ?? "Status",
            order: columns.find((item) => item.status.id === targetStatusId)?.status.order ?? ticket.status_info?.order ?? 0,
          },
        };
        return false;
      }

      return true;
    });

    return {
      ...column,
      tickets: remainingTickets,
    };
  });

  if (!ticketToMove) {
    return columns;
  }

  return nextColumns.map((column) =>
    column.status.id === targetStatusId
      ? {
          ...column,
          tickets: [ticketToMove!, ...column.tickets],
        }
      : column,
  );
}

export function KanbanBoard({ canManageWorkflow, columns }: KanbanBoardProps) {
  const router = useRouter();
  const [boardColumns, setBoardColumns] = useState(columns);
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dropStatusId, setDropStatusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setBoardColumns(columns);
  }, [columns]);

  const handleDrop = (targetStatusId: string) => {
    if (!canManageWorkflow || !draggingTicketId) {
      return;
    }

    const sourceColumn = boardColumns.find((column) =>
      column.tickets.some((ticket) => ticket.id === draggingTicketId),
    );

    if (!sourceColumn || sourceColumn.status.id === targetStatusId) {
      setDraggingTicketId(null);
      setDropStatusId(null);
      return;
    }

    const previousColumns = boardColumns;
    const nextColumns = moveTicketBetweenColumns(boardColumns, draggingTicketId, targetStatusId);

    setBoardColumns(nextColumns);
    setDraggingTicketId(null);
    setDropStatusId(null);
    setError(null);

    startTransition(async () => {
      const result = await moveTicketStatusAction({
        statusId: targetStatusId,
        ticketId: draggingTicketId,
      });

      if (!result.success) {
        setBoardColumns(previousColumns);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isPending ? (
        <p className="text-sm font-medium text-slate-500">Atualizando status no kanban...</p>
      ) : null}

      <section className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {boardColumns.map((column) => (
            <KanbanColumn
              key={column.status.id}
              title={column.status.name}
              tone={
                column.status.name.toLowerCase().includes("atendimento")
                  ? "amber"
                  : column.status.name.toLowerCase().includes("aguardando")
                    ? "violet"
                    : column.status.name.toLowerCase().includes("resolvido") ||
                        column.status.name.toLowerCase().includes("fechado")
                      ? "emerald"
                      : "blue"
              }
              tickets={column.tickets}
              canAssume={canManageWorkflow}
              isDropActive={dropStatusId === column.status.id}
              onDropTicket={
                canManageWorkflow
                  ? () => {
                      handleDrop(column.status.id);
                    }
                  : undefined
              }
              onDragOverColumn={
                canManageWorkflow
                  ? () => {
                      setDropStatusId(column.status.id);
                    }
                  : undefined
              }
              onDragLeaveColumn={
                canManageWorkflow
                  ? () => {
                      setDropStatusId((current) => (current === column.status.id ? null : current));
                    }
                  : undefined
              }
              renderTicket={(ticket) => (
                <div
                  key={ticket.id}
                  draggable={canManageWorkflow}
                  onDragStart={() => {
                    if (!canManageWorkflow) {
                      return;
                    }

                    setDraggingTicketId(ticket.id);
                    setError(null);
                  }}
                  onDragEnd={() => {
                    setDraggingTicketId(null);
                    setDropStatusId(null);
                  }}
                  className={
                    draggingTicketId === ticket.id
                      ? "cursor-grabbing opacity-60"
                      : canManageWorkflow
                        ? "cursor-grab"
                        : ""
                  }
                >
                  <TicketCard
                    ticket={ticket}
                    statusLabel={column.status.name}
                    canAssume={canManageWorkflow}
                  />
                </div>
              )}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
