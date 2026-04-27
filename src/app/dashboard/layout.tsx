import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeController } from "@/components/theme/theme-controller";
import { requireUser } from "@/lib/auth";
import { getCurrentUserProfile, getWorkspaceContext } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getCurrentUserProfile();
  const workspaceContext = await getWorkspaceContext();
  const userName =
    profile.full_name ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email ||
    "Usuario";

  return (
    <div className={profile.theme_preference === "dark" ? "dark" : undefined}>
      <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-[#020817] dark:text-slate-100">
        <ThemeController themePreference={profile.theme_preference} />
        <Sidebar
          activeRole={workspaceContext.activeMembership?.role}
          activeWorkspaceId={workspaceContext.activeMembership?.workspace?.id}
          activeWorkspaceName={workspaceContext.activeMembership?.workspace?.name}
          email={user.email ?? "Sem email"}
          memberships={workspaceContext.memberships}
        />
        <div className="dashboard-shell min-h-screen pl-0 xl:pl-[296px]">
          <DashboardHeader
            avatarUrl={profile.avatar_signed_url}
            themePreference={profile.theme_preference}
            userEmail={user.email ?? "Sem email"}
            userName={userName}
            workspaceName={workspaceContext.activeMembership?.workspace?.name}
          />
          <main className="px-5 py-6 xl:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
