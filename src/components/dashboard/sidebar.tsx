import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import type { MembershipRow } from "@/lib/workspaces";

type SidebarProps = {
  email: string;
  memberships: MembershipRow[];
  activeWorkspaceId?: string;
};

export function Sidebar({ email, memberships, activeWorkspaceId }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">EiDesk</p>
        <h1>Painel operacional</h1>
        <p className="muted">{email}</p>
      </div>

      <nav className="nav-list">
        <Link href="/dashboard">Visão geral</Link>
        <Link href="/dashboard/tickets">Tickets</Link>
        <Link href="/dashboard/team">Equipe</Link>
        <Link href="/dashboard/settings">Configurações</Link>
      </nav>

      <WorkspaceSwitcher memberships={memberships} activeWorkspaceId={activeWorkspaceId} />

      <LogoutButton />
    </aside>
  );
}
