export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {Array.from({ length: 3 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
