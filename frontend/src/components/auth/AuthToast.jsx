import React, { useEffect } from 'react';

export default function AuthToast({ type = 'success', message, onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  const classes =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-600'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="fixed right-4 top-4 z-[100] w-[min(440px,calc(100vw-2rem))]">
      <div className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${classes}`}>
        {message}
      </div>
    </div>
  );
}
