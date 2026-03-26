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
      <span className="text-[14px] font-semibold text-[#1f2937]">{label}</span>
      <div
        className={`flex h-[68px] items-center gap-4 rounded-[22px] border bg-white px-5 shadow-[0_4px_18px_rgba(30,64,175,0.05)] transition ${
          error ? 'border-rose-300' : 'border-[#dfe5ef] focus-within:border-[#5b6bff]'
        }`}
      >
        {Icon ? <Icon className="h-6 w-6 shrink-0 text-[#6b7280]" /> : null}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-[18px] text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-slate-100"
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
