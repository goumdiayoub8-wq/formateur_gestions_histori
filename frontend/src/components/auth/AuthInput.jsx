import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthInput({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  icon: Icon,
  error,
  onChange,
  showToggle = false,
  isPasswordVisible = false,
  onToggleVisibility,
}) {
  const inputType = showToggle ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <label className="block space-y-3" htmlFor={id}>
      <span className="theme-text-soft text-[14px] font-semibold">{label}</span>
      <div
        className={`theme-auth-input flex h-[68px] items-center gap-4 rounded-[22px] border px-5 transition ${
          error ? 'border-rose-300' : 'focus-within:border-[color:var(--color-primary)] focus-within:ring-4 focus-within:ring-[color:var(--color-primary-soft)]'
        }`}
      >
        {Icon ? <Icon className="theme-text-muted h-6 w-6 shrink-0" /> : null}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-[18px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]"
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="theme-text-muted inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
            aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {isPasswordVisible ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}
