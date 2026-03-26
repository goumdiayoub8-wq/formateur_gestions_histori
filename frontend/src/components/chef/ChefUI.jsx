import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';

const BUTTON_STYLES = {
  primary:
    'bg-[linear-gradient(90deg,_#2463ff_0%,_#2858e8_100%)] text-white shadow-[0_14px_28px_rgba(36,99,255,0.28)] hover:brightness-105',
  secondary:
    'bg-[linear-gradient(90deg,_#7c3aed_0%,_#c026d3_100%)] text-white shadow-[0_14px_28px_rgba(168,85,247,0.22)] hover:brightness-105',
  ghost:
    'theme-border theme-card border text-[var(--color-text-soft)] hover:bg-[var(--color-hover)]',
  danger:
    'border border-[#ffd2d2] bg-[#fff4f4] text-[#cf4c4c] hover:bg-[#fff0f0]',
};

const TONE_STYLES = {
  blue: 'bg-[#eef4ff] text-[#2a61f1]',
  violet: 'bg-[#f4efff] text-[#8a5af7]',
  green: 'bg-[#eefbf3] text-[#16a34a]',
  orange: 'bg-[#fff6e9] text-[#ea7b18]',
  red: 'bg-[#fff1f1] text-[#ef4444]',
  slate: 'bg-[#f3f6fb] text-[#51657f]',
};

const ALERT_STYLES = {
  info: 'border-[#bfd5ff] bg-[#f4f8ff] text-[#3560b3]',
  success: 'border-[#c9efce] bg-[#f2fdf3] text-[#1f8b45]',
  warning: 'border-[#ffdba3] bg-[#fff7e8] text-[#c27b12]',
  danger: 'border-[#ffc2c2] bg-[#fff3f3] text-[#d24d4d]',
};

export function useChefToasts() {
  const [toasts, setToasts] = useState([]);
  const timeoutRef = useRef(new Map());

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRef.current.clear();
    };
  }, []);

  const dismissToast = (id) => {
    const timeoutId = timeoutRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast = {
      id,
      tone: toast.tone || 'info',
      title: toast.title || '',
      description: toast.description || '',
    };

    setToasts((current) => [...current, nextToast]);
    const timeoutId = window.setTimeout(() => dismissToast(id), 3600);
    timeoutRef.current.set(id, timeoutId);
  };

  return { toasts, pushToast, dismissToast };
}

export function ChefToastViewport({ toasts = [], onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[0_18px_40px_rgba(20,34,67,0.18)] backdrop-blur',
            ALERT_STYLES[toast.tone] || ALERT_STYLES.info,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm opacity-90">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-current"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChefButton({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  icon: Icon = null,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_STYLES[variant] || BUTTON_STYLES.primary,
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function ChefPageHero({ title, subtitle, action = null, icon: Icon = null }) {
  return (
    <div className="rounded-[28px] bg-[linear-gradient(90deg,_rgba(36,99,255,1)_0%,_rgba(83,49,236,0.95)_58%,_rgba(155,50,235,0.9)_100%)] px-6 py-6 text-white shadow-[0_18px_40px_rgba(66,86,214,0.26)] sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon ? (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
              <Icon className="h-8 w-8" />
            </div>
          ) : null}
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-[2.3rem]">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function ChefSection({ title, subtitle, action = null, className = '', children }) {
  return (
    <Card
      className={cn(
        'theme-card rounded-[28px] p-5 sm:p-6',
        className,
      )}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="theme-text-primary text-[1.65rem] font-bold">{title}</h2> : null}
            {subtitle ? (
              <p className="theme-text-muted mt-1 text-sm leading-6">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </Card>
  );
}

export function ChefStatCard({
  label,
  value,
  helper = '',
  icon: Icon = null,
  tone = 'blue',
  trend = '',
  className = '',
}) {
  return (
    <Card
      className={cn(
        'theme-card rounded-[24px] p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-[16px]', TONE_STYLES[tone] || TONE_STYLES.blue)}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        {trend ? <span className="text-sm font-semibold text-[#1f9d53]">{trend}</span> : null}
      </div>
      <p className="theme-text-muted mt-5 text-sm">{label}</p>
      <p className="theme-text-primary mt-2 text-[2rem] font-bold leading-none">{value}</p>
      {helper ? <p className="theme-text-muted mt-3 text-sm">{helper}</p> : null}
    </Card>
  );
}

export function ChefAlertBanner({ tone = 'info', title, description }) {
  return (
    <div
      className={cn(
        'rounded-[20px] border px-4 py-4 shadow-[0_8px_22px_rgba(41,77,132,0.05)]',
        ALERT_STYLES[tone] || ALERT_STYLES.info,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 opacity-90">{description}</p> : null}
    </div>
  );
}

export function ChefBadge({ children, tone = 'slate', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        TONE_STYLES[tone] || TONE_STYLES.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ChefProgress({
  value = 0,
  max = 100,
  tone = 'blue',
  label = '',
  rightLabel = '',
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const barTone = {
    blue: 'from-[#2f62f4] to-[#4f46e5]',
    violet: 'from-[#8b5cf6] to-[#d946ef]',
    green: 'from-[#22c55e] to-[#16a34a]',
    orange: 'from-[#f59e0b] to-[#f97316]',
    red: 'from-[#fb7185] to-[#ef4444]',
    slate: 'from-[#64748b] to-[#475569]',
  };

  return (
    <div className="space-y-2">
      {(label || rightLabel) && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="theme-text-soft font-semibold">{label}</span>
          <span className="theme-text-muted">{rightLabel}</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500',
            barTone[tone] || barTone.blue,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ChefSearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
}) {
  return (
    <label
      className={cn(
        'flex h-14 items-center gap-3 rounded-[18px] border border-[#d8e4f2] bg-white px-4 shadow-[0_10px_26px_rgba(39,74,129,0.06)]',
        className,
      )}
    >
      <Search className="h-5 w-5 text-[#8da0ba]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-[#334862] outline-none placeholder:text-[#a6b6ca]"
      />
    </label>
  );
}

export function ChefPillTabs({ items = [], active, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'rounded-[18px] px-5 py-3 text-base font-medium transition',
              isActive
                ? 'bg-[linear-gradient(90deg,_#2463ff_0%,_#4f46e5_100%)] text-white shadow-[0_12px_28px_rgba(36,99,255,0.22)]'
                : 'bg-white text-[#41536f] shadow-[inset_0_0_0_1px_#e1e9f4] hover:bg-[#f8fbff]',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChefTableShell({ children }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dce6f3] bg-white shadow-[0_18px_36px_rgba(39,74,129,0.08)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function ChefEmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#d8e3f3] bg-[#fbfdff] px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-[#22334a]">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#7b8ea8]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ChefLoadingState({ label = 'Chargement...' }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-[#dce6f3] bg-white">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#48628d]">
        <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[#d2ddf0] border-t-[#2f62f4]" />
        {label}
      </div>
    </div>
  );
}

export function ChefField({ label, help = '', error = '', children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#40526c]">{label}</span>
      {children}
      {help ? <p className="text-xs text-[#7d90aa]">{help}</p> : null}
      {error ? <p className="text-xs font-semibold text-[#cf4c4c]">{error}</p> : null}
    </label>
  );
}

export function ChefInput(props) {
  return (
    <input
      {...props}
      className={cn(
        'h-12 w-full rounded-[16px] border border-[#dce5f1] bg-[#fbfdff] px-4 text-sm text-[#1f2a3d] outline-none transition focus:border-[#8bb2ea] focus:ring-4 focus:ring-[#e4efff]',
        props.className,
      )}
    />
  );
}

export function ChefSelect(props) {
  return (
    <select
      {...props}
      className={cn(
        'h-12 w-full rounded-[16px] border border-[#dce5f1] bg-[#fbfdff] px-4 text-sm text-[#1f2a3d] outline-none transition focus:border-[#8bb2ea] focus:ring-4 focus:ring-[#e4efff]',
        props.className,
      )}
    />
  );
}

export function ChefCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 rounded-[16px] border border-[#dce5f1] bg-[#fbfdff] px-4 py-3 text-sm text-[#40526c]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#b5c6de] text-[#2451ff]"
      />
      {label}
    </label>
  );
}

export function ChefModal({
  open,
  title,
  subtitle = '',
  children,
  footer = null,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-[#dfe8f6] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[1.65rem] font-bold text-[#18243a]">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-[#7487a1]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe5f2] text-[#73859e]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
