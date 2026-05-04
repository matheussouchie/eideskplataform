import { SkeletonCard } from "@/components/skeletons/skeleton-card";

export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <SkeletonCard className="min-h-[320px]" />
        <SkeletonCard className="min-h-[320px]" />
      </section>
    </section>
  );
}
