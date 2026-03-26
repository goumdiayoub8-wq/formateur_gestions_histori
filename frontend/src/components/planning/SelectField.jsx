import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectField({
  icon: Icon,
  label,
  tooltip,
  value,
  onChange,
  options = [],
  placeholder = 'Selectionner',
  error = '',
  disabled = false,
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#6b7d96]">
        <span className="group relative inline-flex h-8 w-8 items-center justify-center rounded-[12px] bg-[#eef4ff] text-[#2d5cff]">
          <Icon className="h-4 w-4" />
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-full bg-[#1d2740] px-3 py-1 text-[11px] font-medium text-white shadow-lg group-hover:inline-flex">
            {tooltip || label}
          </span>
        </span>
        <span>{label}</span>
      </div>

      <div className={`relative rounded-[18px] border bg-[#fbfdff] transition ${error ? 'border-[#ef4444]' : 'border-[#d7e3f3] focus-within:border-[#7aa2ff] focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]'}`}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-[18px] bg-transparent px-4 py-3.5 pr-10 text-[15px] text-[#1d2538] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#93a4bb]" />
      </div>

      {error ? <p className="mt-2 text-[13px] font-medium text-[#dc2626]">{error}</p> : null}
    </label>
  );
}
