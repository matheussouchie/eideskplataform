"use client";

import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
        pendingLabel="Saindo..."
      >
        Sair
      </SubmitButton>
    </form>
  );
}
