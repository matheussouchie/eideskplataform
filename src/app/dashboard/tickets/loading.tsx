import { SkeletonKanban } from "@/components/skeletons/skeleton-kanban";

export default function TicketsLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <SkeletonKanban />
    </section>
  );
}
