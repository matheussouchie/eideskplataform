"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { updateThemePreferenceAction } from "@/app/actions/profile";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12H2.75M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23L5.46 5.46"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20.25 14.2A8.75 8.75 0 0 1 9.8 3.75a8.75 8.75 0 1 0 10.45 10.45Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle({ themePreference }: { themePreference: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname;
  const nextTheme = themePreference === "dark" ? "light" : "dark";
  const label = themePreference === "dark" ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <form action={updateThemePreferenceAction}>
      <input type="hidden" name="themePreference" value={nextTheme} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
      >
        {themePreference === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </form>
  );
}
