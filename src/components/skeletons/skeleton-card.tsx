export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      <div className="h-1 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-3 dark:bg-slate-900"
            >
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
