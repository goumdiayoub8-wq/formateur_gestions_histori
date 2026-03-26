import React from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        'theme-card rounded-[28px] border p-6 backdrop-blur-xl',
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
          <span className="inline-flex rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            {eyebrow}
          </span>
        ) : null}
        <div>
          <h2 className="theme-text-primary text-xl font-bold tracking-tight">{title}</h2>
          {description ? <p className="theme-text-muted mt-2 max-w-2xl text-sm leading-6">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
