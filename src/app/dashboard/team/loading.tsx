import { SkeletonTable } from "@/components/skeletons/skeleton-table";

export default function TeamLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <SkeletonTable />
    </section>
  );
}
