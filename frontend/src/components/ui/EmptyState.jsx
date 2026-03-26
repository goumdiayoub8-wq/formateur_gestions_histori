import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      {Icon ? (
        <div className="mb-4 rounded-3xl bg-slate-950 p-4 text-white shadow-lg shadow-slate-900/10">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
