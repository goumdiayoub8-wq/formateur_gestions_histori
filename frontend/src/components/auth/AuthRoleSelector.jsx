import React from 'react';

function RoleCard({ active, option, onClick, showTestAccounts }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border px-5 py-6 text-left transition ${
        active
          ? 'border-[#635bff] bg-[#f4f1ff] shadow-[0_12px_28px_rgba(99,91,255,0.14)]'
          : 'border-[#dbe3ef] bg-white hover:border-[#c7d4e8] hover:bg-[#fbfdff]'
      }`}
    >
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-[#ebe6ff] text-[#635bff]' : 'bg-[#f4f7fb] text-[#637083]'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className={`text-[18px] font-semibold leading-6 ${active ? 'text-[#4f46e5]' : 'text-[#1f2937]'}`}>{option.label}</p>
      <p className="mt-2 text-[14px] text-[#64748b]">{option.helper}</p>
      {showTestAccounts ? <p className="mt-3 text-[12px] font-medium text-[#8a94a6]">{option.testAccount.email}</p> : null}
    </button>
  );
}

export default function AuthRoleSelector({
  label,
  options,
  selectedKey,
  onSelect,
  showTestAccounts = false,
  hint = '',
}) {
  return (
    <div>
      <p className="mb-5 text-[18px] font-medium text-[#64748b]">{label}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <RoleCard
            key={option.key}
            option={option}
            active={selectedKey === option.key}
            onClick={() => onSelect(option)}
            showTestAccounts={showTestAccounts}
          />
        ))}
      </div>
      {hint ? <p className="mt-4 text-[14px] text-[#7b8aa2]">{hint}</p> : null}
    </div>
  );
}
