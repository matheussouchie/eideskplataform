"use client";

import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
        pendingLabel="Saindo..."
      >
        Sair
      </SubmitButton>
    </form>
  );
}
