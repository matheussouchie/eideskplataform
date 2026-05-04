"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { APP_SYSTEM_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MembershipRow } from "@/lib/workspaces";

const SIDEBAR_STORAGE_KEY = "eidesk-sidebar-collapsed";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 1279px)";

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
      <path
        d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 18.5a4.5 4.5 0 0 1 7 0M13 18a4 4 0 0 1 6.5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      <path
        d="M12 3.75 5.75 6v5.44c0 4.2 2.52 8.01 6.25 9.81 3.73-1.8 6.25-5.6 6.25-9.81V6L12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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

export const Sidebar = memo(function Sidebar({
  activeRole,
  activeWorkspaceId,
  activeWorkspaceName,
  email,
  memberships,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  }, [collapsed]);

  useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    const closeSidebarOnResize = () => {
      if (!window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("eidesk:mobile-sidebar-toggle", openSidebar as EventListener);
    window.addEventListener("resize", closeSidebarOnResize);

    return () => {
      window.removeEventListener("eidesk:mobile-sidebar-toggle", openSidebar as EventListener);
      window.removeEventListener("resize", closeSidebarOnResize);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const visibleLinks = useMemo(
    () => links.filter((link) => !link.requireAdmin || ["owner", "admin"].includes(activeRole ?? "")),
    [activeRole],
  );

  const renderSidebarContent = (mode: "desktop" | "mobile") => {
    const isDesktop = mode === "desktop";
    const isCollapsed = isDesktop ? collapsed : false;

    return (
      <>
        <div className={cn("mb-6 flex items-center gap-3", isCollapsed ? "justify-center px-0" : "px-2")}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-bold text-white">
            E
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">EiDesk</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
            </div>
          ) : null}
          {!isDesktop ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-950"
              aria-label="Fechar navegacao"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        {isDesktop ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "mb-4 inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900",
              isCollapsed ? "justify-center px-0" : "justify-between px-4",
            )}
            aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <span className={cn("text-xs uppercase tracking-[0.22em]", isCollapsed ? "hidden" : "block")}>
              Navegacao
            </span>
            <span className={cn("text-lg", isCollapsed ? "rotate-180" : "")}>{"<"}</span>
          </button>
        ) : null}

        <Link
          href="/dashboard/tickets/new"
          title="Adicionar Ticket"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-4 inline-flex h-12 items-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,116,244,0.35)] transition hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(14,116,244,0.42)]",
            isCollapsed ? "justify-center px-0" : "justify-center gap-2 px-4",
          )}
        >
          <PlusIcon />
          {!isCollapsed ? <span>Adicionar Ticket</span> : null}
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
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-2xl py-3 text-sm font-medium transition",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? "bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-sm",
                    active
                      ? "bg-white/12 text-white dark:bg-slate-950/10 dark:text-slate-950"
                      : "bg-slate-100 text-current dark:bg-slate-900/30 dark:text-current",
                  )}
                >
                  {link.icon}
                </span>
                {!isCollapsed ? link.label : null}
              </Link>
            );
          })}

          <div className="pt-3">
            <div
              className={cn(
                "rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 transition-all dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400",
                isCollapsed ? "px-0 py-4 text-center" : "px-3 py-3",
              )}
              title="Placeholders"
            >
              {isCollapsed ? "..." : "Placeholders"}
              {!isCollapsed ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Clientes e automacoes entram nas proximas sprints.
                </p>
              ) : null}
            </div>
          </div>
        </nav>

        <div
          className={cn(
            "mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-3 transition-all dark:border-slate-800 dark:bg-slate-900/60",
            isCollapsed ? "flex items-center justify-center p-2" : "",
          )}
        >
          {!isCollapsed ? (
            <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
              title={activeWorkspaceName ? `Workspace ativo - ${activeWorkspaceName}` : "Workspace ativo"}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 20V8.5A1.5 1.5 0 0 1 7.5 7H10v13M10 20V5.5A1.5 1.5 0 0 1 11.5 4h5A1.5 1.5 0 0 1 18 5.5V20M4 20h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6">
          <LogoutButton />
          {!isCollapsed ? (
            <p className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              {APP_SYSTEM_LABEL}
            </p>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition xl:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[296px] max-w-[86vw] flex-col border-r border-slate-200 bg-white/95 px-4 py-5 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.20)] transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 xl:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderSidebarContent("mobile")}
      </aside>

      <aside
        className={cn(
          "hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:flex-col xl:border-r xl:border-slate-200 xl:bg-white/95 xl:px-4 xl:py-5 xl:text-slate-900 xl:transition-[width] xl:duration-300 dark:xl:border-slate-800 dark:xl:bg-slate-950 dark:xl:text-slate-100",
          collapsed ? "xl:w-[108px]" : "xl:w-[296px]",
        )}
      >
        {renderSidebarContent("desktop")}
      </aside>
    </>
  );
});
