import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  href: string;
  label: string;
  total: number;
  subtitle: string;
  breakdown: Array<{ label: string; value: number }>;
  accent?: "blue" | "slate";
};

const accentMap = {
  blue: "from-sky-500 via-blue-600 to-indigo-600",
  slate: "from-slate-500 via-slate-700 to-slate-900",
};

export function MetricCard({
  href,
  label,
  total,
  subtitle,
  breakdown,
  accent = "blue",
}: MetricCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_18px_44px_rgba(2,6,23,0.6)]">
        <div className={cn("h-1 bg-gradient-to-r", accentMap[accent])} />
        <div className="space-y-6 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{total}</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Abrir fila
            </span>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>{item.label}</span>
                <strong className="font-semibold text-slate-900 dark:text-white">{item.value}</strong>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </Card>
    </Link>
  );
}
