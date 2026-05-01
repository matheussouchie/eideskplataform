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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
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
                    ? "w-full rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-left text-sm font-medium text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-white"
                    : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                }
                pendingLabel="Trocando..."
              >
                {workspace.name} - {membership.role}
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </div>
  );
}
