"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { SkeletonKanban } from "@/components/skeletons/skeleton-kanban";
import type { TicketStatusWithMeta, TicketWithRelations } from "@/lib/workspaces";

const LazyKanbanBoard = dynamic(
  () => import("@/components/kanban/kanban-board").then((module) => module.KanbanBoard),
  {
    loading: () => <SkeletonKanban />,
  },
);

type TicketsBoardViewProps = {
  allTickets: TicketWithRelations[];
  canManageWorkflow: boolean;
  currentDepartmentId: string | null;
  currentDepartmentName: string | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  initialQuery: string;
  initialScope: string;
  statuses: TicketStatusWithMeta[];
  userId: string;
};

const scopeItems = [
  { id: "mine", label: "Meus Tickets" },
  { id: "team", label: "Tickets do Time" },
  { id: "department", label: "Tickets do Departamento" },
] as const;

export const TicketsBoardView = memo(function TicketsBoardView({
  allTickets,
  canManageWorkflow,
  currentDepartmentId,
  currentDepartmentName,
  currentTeamId,
  currentTeamName,
  initialQuery,
  initialScope,
  statuses,
  userId,
}: TicketsBoardViewProps) {
  const [scope, setScope] = useState(initialScope || "department");
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (scope && scope !== "department") {
      params.set("scope", scope);
    } else {
      params.delete("scope");
    }

    if (search.trim()) {
      params.set("query", search.trim());
    } else {
      params.delete("query");
    }

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [scope, search]);

  const handleScopeChange = useCallback((nextScope: string) => {
    setScope(nextScope);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const scopedTickets = useMemo(() => {
    if (scope === "mine") {
      return allTickets.filter((ticket) => ticket.requester_id === userId || ticket.assigned_to === userId);
    }

    if (scope === "team") {
      return currentTeamId ? allTickets.filter((ticket) => ticket.team_id === currentTeamId) : [];
    }

    return currentDepartmentId
      ? allTickets.filter((ticket) => ticket.department_id === currentDepartmentId)
      : allTickets;
  }, [allTickets, currentDepartmentId, currentTeamId, scope, userId]);

  const tickets = useMemo(() => {
    if (!debouncedSearch) {
      return scopedTickets;
    }

    return scopedTickets.filter((ticket) =>
      [
        ticket.title,
        ticket.description,
        ticket.requester?.full_name,
        ticket.assignee?.full_name,
        ticket.priority,
        ticket.status_info?.name,
        ticket.team?.name,
        ticket.department?.name,
        ticket.product?.name,
        ticket.category?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(debouncedSearch)),
    );
  }, [debouncedSearch, scopedTickets]);

  const columns = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        tickets: tickets.filter((ticket) => ticket.status_id === status.id),
      })),
    [statuses, tickets],
  );

  const isFiltering = search.trim().toLowerCase() !== debouncedSearch;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {scopeItems.map((item) => {
                const active = scope === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScopeChange(item.id)}
                    className={
                      active
                        ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
                        : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar tickets por titulo, cliente ou prioridade"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-950"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isFiltering ? "Filtrando tickets..." : `${tickets.length} tickets exibidos`}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Busca com debounce de 400ms</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {columns.map((column) => (
              <div key={column.status.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {column.status.name}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{column.tickets.length}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              Meu time: {currentTeamName ?? "Nao definido"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              Meu departamento: {currentDepartmentName ?? "Nao definido"}
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nova experiencia de abertura</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A criacao agora acontece em uma tela dedicada, com rascunho automatico, protecao contra perda e classificacao completa.
            </p>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">O que voce ganha nesta sprint</p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>- titulo e descricao com rascunho automatico</li>
              <li>- classificacao por produto, categoria e prioridade</li>
              <li>- alerta ao tentar sair com informacoes nao enviadas</li>
              <li>- encaminhamento automatico para a esteira do seu time</li>
            </ul>
          </div>

          <Link
            href="/dashboard/tickets/new"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
          >
            Abrir formulario completo
          </Link>
        </Card>
      </section>

      <LazyKanbanBoard columns={columns} canManageWorkflow={canManageWorkflow} />
    </div>
  );
});
