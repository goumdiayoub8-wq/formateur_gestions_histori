import React from "react";
import { Card } from "./Card";
import { cn } from "../../lib/cn";

export default function MetricCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
}) {
  const toneStyles = {
    default: {
      accent: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
      soft: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200",
    },
    brand: {
      accent: "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600",
      soft: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200",
    },
    emerald: {
      accent: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600",
      soft: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200",
    },
    amber: {
      accent: "bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600",
      soft: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
    },
    rose: {
      accent: "bg-gradient-to-r from-rose-400 via-rose-500 to-pink-600",
      soft: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200",
    },
    purple: {
      accent: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600",
      soft: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200",
    },
  };
  const palette = toneStyles[tone] || toneStyles.default;

  return (
    <Card className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-sm backdrop-blur-none dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl">
      <div className={cn("absolute inset-x-0 top-0 h-1.5", palette.accent)} />
      <div className="flex items-start justify-between gap-4 p-6 pt-7">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 transition-colors duration-300 dark:text-slate-400">
            {label}
          </p>
          <p className="text-4xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white">
            {value}
          </p>
          {meta ? (
            <p className="text-sm font-medium text-slate-500 transition-colors duration-300 dark:text-slate-400">
              {meta}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "rounded-2xl p-3 shadow-sm bg-blue-50 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200",
              palette.soft,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
