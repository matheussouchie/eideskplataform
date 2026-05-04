export function SkeletonKanban() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {Array.from({ length: 4 }).map((_, columnIndex) => (
            <section
              key={columnIndex}
              className="flex w-[280px] shrink-0 flex-col rounded-[28px] border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60 md:w-[300px] xl:w-[320px]"
            >
              <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="space-y-3">
                      <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
