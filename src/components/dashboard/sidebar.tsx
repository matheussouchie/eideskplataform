"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { cn } from "@/lib/utils";
import type { MembershipRow } from "@/lib/workspaces";

type SidebarProps = {
  email: string;
  memberships: MembershipRow[];
  activeWorkspaceId?: string;
};

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/dashboard/tickets", label: "Tickets", icon: "T" },
  { href: "/dashboard/team", label: "Equipe", icon: "E" },
  { href: "/dashboard/settings", label: "Configuracoes", icon: "C" },
];

export function Sidebar({ email, memberships, activeWorkspaceId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:w-[296px] xl:flex-col xl:border-r xl:border-slate-200 xl:bg-slate-950 xl:px-4 xl:py-5 xl:text-slate-100">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-bold text-white">
          E
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">EiDesk</p>
          <p className="text-xs text-slate-400">{email}</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {links.map((link) => {
          const active =
            link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/10 text-sm">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}

        <div className="pt-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
            Placeholders
            <p className="mt-1 text-xs text-slate-500">Clientes e automacoes entram nas proximas sprints.</p>
          </div>
        </div>
      </nav>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
        <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />
      </div>

      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </aside>
  );
}
