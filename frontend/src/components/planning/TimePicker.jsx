import React from 'react';

export default function TimePicker({
  icon: Icon,
  label,
  tooltip,
  value,
  onChange,
  error = '',
  disabled = false,
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
        <span className="group relative inline-flex h-8 w-8 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200">
          <Icon className="h-4 w-4" />
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm group-hover:inline-flex dark:border-white/10 dark:bg-slate-900 dark:text-white dark:shadow-none">
            {tooltip || label}
          </span>
        </span>
        <span>{label}</span>
      </div>

      <div className={`rounded-[18px] border bg-white transition-colors duration-300 dark:bg-slate-900/50 ${error ? 'border-red-500 dark:border-red-400/40' : 'border-slate-200 focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)] dark:border-white/10'}`}>
        <input
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min="08:00"
          max="18:00"
          disabled={disabled}
          className="w-full rounded-[18px] bg-transparent px-4 py-3.5 text-[15px] text-slate-900 outline-none transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100"
        />
      </div>

      {error ? <p className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-300">{error}</p> : null}
    </label>
  );
}
