import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:backdrop-blur-xl">
      {Icon ? (
        <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 dark:text-slate-100">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 transition-colors duration-300 dark:text-slate-400">{description}</p> : null}
    </div>
  );
}
