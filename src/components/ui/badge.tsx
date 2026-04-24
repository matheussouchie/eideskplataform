import { cn } from "@/lib/utils";

type BadgeVariant =
  | "status-open"
  | "status-progress"
  | "status-waiting"
  | "status-resolved"
  | "priority-low"
  | "priority-medium"
  | "priority-high"
  | "priority-urgent"
  | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  "status-open": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  "status-progress": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "status-waiting": "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "status-resolved": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "priority-low": "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  "priority-medium": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "priority-high": "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  "priority-urgent": "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
