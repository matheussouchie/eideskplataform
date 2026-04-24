import { switchWorkspaceAction } from "@/app/actions/workspaces";
import { SubmitButton } from "@/components/forms/submit-button";
import type { MembershipRow } from "@/lib/workspaces";

type WorkspaceSwitcherProps = {
  memberships: MembershipRow[];
  activeWorkspaceId?: string;
};

export function WorkspaceSwitcher({
  memberships,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  if (!memberships.length) {
    return null;
  }

  return (
    <div className="workspace-switcher">
      <h3>Workspace ativo</h3>
      <div className="workspace-list">
        {memberships.map((membership) => {
          const workspace = membership.workspace!;
          const isActive = workspace.id === activeWorkspaceId;

          return (
            <form key={workspace.id} action={switchWorkspaceAction}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <SubmitButton
                className={isActive ? "workspace-chip active" : "workspace-chip"}
                pendingLabel="Trocando..."
              >
                {workspace.name} · {membership.role}
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </div>
  );
}
