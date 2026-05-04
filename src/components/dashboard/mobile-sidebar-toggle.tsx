"use client";

export function MobileSidebarToggle() {
  return (
    <button
      type="button"
      aria-label="Abrir navegacao"
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-950 xl:hidden"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("eidesk:mobile-sidebar-toggle"));
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
