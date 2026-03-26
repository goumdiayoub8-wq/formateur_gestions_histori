import React from 'react';
import Spinner from '../ui/Spinner';

export default function AuthButton({ children, loading, disabled, className = '', ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex h-[62px] w-full items-center justify-center gap-3 rounded-[20px] bg-[linear-gradient(180deg,_#27568e_0%,_#3c8bdc_100%)] px-6 text-[18px] font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {loading ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  );
}
