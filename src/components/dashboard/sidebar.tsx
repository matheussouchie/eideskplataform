"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { cn } from "@/lib/utils";
import type { MembershipRow } from "@/lib/workspaces";

const SIDEBAR_STORAGE_KEY = "eidesk-sidebar-collapsed";

type SidebarProps = {
  activeRole?: string;
  activeWorkspaceId?: string;
  activeWorkspaceName?: string;
  email: string;
  memberships: MembershipRow[];
};

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  requireAdmin?: boolean;
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M5 5h6v6H5zM13 5h6v10h-6zM5 13h6v6H5z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 5.75h10a2 2 0 0 1 2 2V10a2 2 0 0 0 0 4v2.25a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V14a2 2 0 0 0 0-4V7.75a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 18.5a4.5 4.5 0 0 1 7 0M13 18a4 4 0 0 1 6.5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm8 3.75-1.77.68a6.86 6.86 0 0 1-.42 1.02l.77 1.72-1.8 1.8-1.72-.77c-.32.16-.66.3-1.02.42L12 20l-2.04-1.16c-.36-.12-.7-.26-1.02-.42l-1.72.77-1.8-1.8.77-1.72a6.86 6.86 0 0 1-.42-1.02L4 12l1.77-.68c.1-.35.24-.7.42-1.02l-.77-1.72 1.8-1.8 1.72.77c.32-.16.66-.3 1.02-.42L12 4l2.04 1.16c.36.12.7.26 1.02.42l1.72-.77 1.8 1.8-.77 1.72c.16.32.3.66.42 1.02L20 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3.75 5.75 6v5.44c0 4.2 2.52 8.01 6.25 9.81 3.73-1.8 6.25-5.6 6.25-9.81V6L12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

const links: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/tickets", label: "Tickets", icon: <TicketIcon /> },
  { href: "/dashboard/team", label: "Equipe", icon: <TeamIcon /> },
  { href: "/dashboard/settings", label: "Configuracoes", icon: <SettingsIcon /> },
  { href: "/dashboard/admin/tickets", label: "Governanca", icon: <ShieldIcon />, requireAdmin: true },
];

export function Sidebar({
  activeRole,
  activeWorkspaceId,
  activeWorkspaceName,
  email,
  memberships,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const visibleLinks = links.filter((link) => !link.requireAdmin || ["owner", "admin"].includes(activeRole ?? ""));

  return (
    <aside
      className={cn(
        "hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:flex-col xl:border-r xl:border-slate-200 xl:bg-slate-950 xl:px-4 xl:py-5 xl:text-slate-100 xl:transition-[width] xl:duration-300 dark:xl:border-slate-800",
        collapsed ? "xl:w-[108px]" : "xl:w-[296px]",
      )}
    >
      <div className={cn("mb-6 flex items-center gap-3", collapsed ? "justify-center px-0" : "px-2")}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-bold text-white">
          E
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-white">EiDesk</p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        className={cn(
          "mb-4 inline-flex h-11 items-center rounded-2xl border border-slate-800 bg-slate-900/80 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
        aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
      >
        <span className={cn("text-xs uppercase tracking-[0.22em]", collapsed ? "hidden" : "block")}>Navegacao</span>
        <span className={cn("text-lg", collapsed ? "rotate-180" : "")}>⌃</span>
      </button>

      <Link
        href="/dashboard/tickets/new"
        title="Adicionar Ticket"
        className={cn(
          "mb-4 inline-flex h-12 items-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,116,244,0.35)] transition hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(14,116,244,0.42)]",
          collapsed ? "justify-center px-0" : "justify-center gap-2 px-4",
        )}
      >
        <PlusIcon />
        {!collapsed ? <span>Adicionar Ticket</span> : null}
      </Link>

      <nav className="space-y-1.5">
        {visibleLinks.map((link) => {
          const active =
            link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={cn(
                "flex items-center rounded-2xl py-3 text-sm font-medium transition",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/10 text-sm">
                {link.icon}
              </span>
              {!collapsed ? link.label : null}
            </Link>
          );
        })}

        <div className="pt-3">
          <div
            className={cn(
              "rounded-2xl border border-slate-800 bg-slate-900/60 text-sm text-slate-400 transition-all",
              collapsed ? "px-0 py-4 text-center" : "px-3 py-3",
            )}
            title="Placeholders"
          >
            {collapsed ? "…" : "Placeholders"}
            {!collapsed ? (
              <p className="mt-1 text-xs text-slate-500">Clientes e automacoes entram nas proximas sprints.</p>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
        {!collapsed ? (
          <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
        ) : (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Workspace</p>
            <p className="mt-2 text-xs font-semibold text-white">{activeWorkspaceName ? "Ativo" : "N/A"}</p>
          </div>
        )}
      </div>

      <div className="mt-auto rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4">
        {!collapsed ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace ativo</p>
            <p className="mt-3 text-lg font-semibold text-white">{activeWorkspaceName ?? "Nao definido"}</p>
            <p className="mt-1 text-sm text-slate-400">{activeRole ?? "Sem papel"}</p>
          </>
        ) : (
          <p className="text-center text-xs font-semibold text-white">{(activeRole ?? "-").slice(0, 1).toUpperCase()}</p>
        )}
      </div>

      <div className="mt-6 pt-2">
        <LogoutButton />
      </div>
    </aside>
  );
}
