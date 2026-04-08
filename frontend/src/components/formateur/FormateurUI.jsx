import React from 'react';
import { cn } from '../../lib/cn';

export function FormateurPanel({ className, children }) {
  return (
    <section
      className={cn(
        'theme-card rounded-[28px] border',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function FormateurSectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="theme-text-primary text-[18px] font-bold tracking-tight">{title}</h2>
        {description ? <p className="theme-text-muted mt-1 text-[15px]">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function FormateurStatCard({ icon: Icon, iconClassName, label, value, helper, progress, progressClassName }) {
  return (
    <FormateurPanel className="hover-card p-5">
      <div className={cn('mb-5 inline-flex h-13 w-13 items-center justify-center rounded-[18px]', iconClassName)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      <p className="theme-text-primary mt-3 text-[22px] font-bold tracking-tight">{value}</p>
      {helper ? <p className="theme-text-muted mt-2 text-[14px]">{helper}</p> : null}
      {typeof progress === 'number' ? (
        <div className="mt-4 h-2 rounded-full bg-slate-200 transition-colors duration-300 dark:bg-white/10">
          <div
            className={cn('h-2 rounded-full bg-emerald-500 dark:bg-emerald-400', progressClassName)}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </FormateurPanel>
  );
}

export function FormateurSemesterBadge({ value }) {
  return (
    <span className="hover-badge inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-[12px] font-bold text-blue-700 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
      {value}
    </span>
  );
}

export function FormateurMiniProgress({ value, tone = 'violet' }) {
  const toneClassName =
    tone === 'green'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : tone === 'blue'
        ? 'bg-blue-600 dark:bg-blue-400'
        : 'bg-gradient-to-r from-violet-500 to-fuchsia-600';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200 transition-colors duration-300 dark:bg-white/10">
        <div className={cn('h-full rounded-full', toneClassName)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="text-[14px] font-semibold text-violet-700 transition-colors duration-300 dark:text-violet-300">{Math.round(value)}%</span>
    </div>
  );
}

export function FormateurEmptyBlock({ title, description }) {
  return (
    <div className="theme-card-muted theme-border rounded-[24px] border border-dashed px-6 py-10 text-center">
      <p className="theme-text-primary text-[17px] font-semibold">{title}</p>
      {description ? <p className="theme-text-muted mt-2 text-[15px] leading-7">{description}</p> : null}
    </div>
  );
}

export function FormateurAlertCard({ alert }) {
  const tone = alert?.type || 'info';
  const toneClassName =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200'
        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200';
  const badgeClassName =
    tone === 'error'
      ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
        : 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200';

  return (
    <div className={cn('hover-row rounded-[22px] border px-5 py-4', toneClassName)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-bold tracking-tight">{alert?.message || 'Alerte'}</p>
          {alert?.details ? <p className="mt-1 text-[14px] leading-6 opacity-90">{alert.details}</p> : null}
        </div>
        <span className={cn('inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', badgeClassName)}>
          {tone === 'error' ? 'Erreur' : tone === 'warning' ? 'Alerte' : 'Info'}
        </span>
      </div>
    </div>
  );
}
