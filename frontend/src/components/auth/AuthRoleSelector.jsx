import React from 'react';

function RoleCard({ active, option, onClick, showTestAccounts }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border px-5 py-6 text-left transition ${
        active
          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] shadow-[0_12px_28px_var(--color-shadow)]'
          : 'theme-card border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-card-muted)]'
      }`}
    >
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]' : 'bg-[color:var(--color-card-muted)] text-[color:var(--color-text-muted)]'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className={`text-[18px] font-semibold leading-6 ${active ? 'text-[color:var(--color-primary)]' : 'text-[color:var(--color-text)]'}`}>{option.label}</p>
      <p className="mt-2 text-[14px] text-[color:var(--color-text-muted)]">{option.helper}</p>
      {showTestAccounts ? <p className="mt-3 text-[12px] font-medium text-[color:var(--color-text-muted)]">{option.testAccount.email}</p> : null}
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
      <p className="theme-text-muted mb-5 text-[18px] font-medium">{label}</p>
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
      {hint ? <p className="theme-text-muted mt-4 text-[14px]">{hint}</p> : null}
    </div>
  );
}
