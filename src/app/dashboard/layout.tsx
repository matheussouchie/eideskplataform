import { Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const workspaceContext = await getWorkspaceContext();

  return (
    <div className="dashboard-shell">
      <Sidebar
        email={user.email ?? "Sem email"}
        memberships={workspaceContext.memberships}
        activeWorkspaceId={workspaceContext.activeMembership?.workspace?.id}
      />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
