import { DashboardHeader } from "@/components/dashboard/header";
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
  const userName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email ||
    "Usuário";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Sidebar
        email={user.email ?? "Sem email"}
        memberships={workspaceContext.memberships}
        activeWorkspaceId={workspaceContext.activeMembership?.workspace?.id}
      />
      <div className="min-h-screen pl-0 xl:pl-[296px]">
        <DashboardHeader
          userEmail={user.email ?? "Sem email"}
          userName={userName}
          workspaceName={workspaceContext.activeMembership?.workspace?.name}
        />
        <main className="px-5 py-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
