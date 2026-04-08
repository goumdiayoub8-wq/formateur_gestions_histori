import React from "react";
import { cn } from "../../lib/cn";

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-sm backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 transition-colors duration-300 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
            {eyebrow}
          </span>
        ) : null}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-slate-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 transition-colors duration-300 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
