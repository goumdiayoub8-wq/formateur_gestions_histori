import React from 'react';
import Spinner from '../ui/Spinner';

export default function AuthButton({ children, loading, disabled, className = '', ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`theme-auth-button inline-flex h-[62px] w-full items-center justify-center gap-3 rounded-[20px] px-6 text-[18px] font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {loading ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  );
}
