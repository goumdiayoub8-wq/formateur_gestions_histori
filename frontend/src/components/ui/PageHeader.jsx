import React from 'react';

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-3xl">
        {eyebrow ? (
          <span className="theme-page-eyebrow mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] shadow-sm">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="theme-text-primary text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="theme-text-muted mt-3 text-sm leading-7 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
