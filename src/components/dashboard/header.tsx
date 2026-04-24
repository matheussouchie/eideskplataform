import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";

type DashboardHeaderProps = {
  avatarUrl?: string | null;
  themePreference: string;
  userName: string;
  userEmail: string;
  workspaceName?: string;
};

export function DashboardHeader({
  avatarUrl,
  themePreference,
  userName,
  userEmail,
  workspaceName,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90 xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
            {workspaceName ? `Workspace · ${workspaceName}` : "EiDesk"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Central operacional
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action="/dashboard/tickets" className="w-full sm:w-[360px]">
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                ⌕
              </span>
              <input
                name="query"
                placeholder="Buscar tickets por título, cliente ou prioridade"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-950"
              />
            </label>
          </form>

          <ThemeToggle themePreference={themePreference} />

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-sky-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500 dark:hover:bg-slate-950"
          >
            <Avatar name={userName} src={avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
