"use client";

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
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Workspace ativo
        </p>
      </div>

      <div className="space-y-2">
        {memberships.map((membership) => {
          const workspace = membership.workspace!;
          const isActive = workspace.id === activeWorkspaceId;

          return (
            <form key={workspace.id} action={switchWorkspaceAction}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <SubmitButton
                className={
                  isActive
                    ? "w-full rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-left text-sm font-medium text-white"
                    : "w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
                }
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
