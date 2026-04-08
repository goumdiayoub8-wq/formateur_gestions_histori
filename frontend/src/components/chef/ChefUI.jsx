import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Card } from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumButton } from "../ui/PremiumButton";
import { PremiumCard } from "../ui/PremiumCard";
import { toast } from "sonner";

const BUTTON_STYLES = {
  primary:
    "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm hover:brightness-105 dark:shadow-none",
  secondary:
    "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-sm hover:brightness-105 dark:shadow-none",
  ghost:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
  danger:
    "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15",
};

const TONE_STYLES = {
  blue: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200",
  violet:
    "bg-violet-500/10 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200",
  green:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200",
  orange:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
  red: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200",
  slate: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
};

const ALERT_STYLES = {
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
};

export function useChefToasts() {
  const pushToast = useCallback((toastData) => {
    switch (toastData.tone) {
      case "success":
        toast.success(toastData.title, { description: toastData.description });
        break;
      case "danger":
        toast.error(toastData.title, { description: toastData.description });
        break;
      case "warning":
        toast.warning(toastData.title, { description: toastData.description });
        break;
      default:
        toast.info(toastData.title, { description: toastData.description });
    }
  }, []);

  const dismissToast = useCallback(() => {}, []);

  return { toasts: [], pushToast, dismissToast };
}

export function ChefToastViewport({ toasts = [], onDismiss }) {
  return null;
}

export function ChefButton({
  children,
  type = "button",
  variant = "primary",
  className = "",
  icon: Icon = null,
  disabled = false,
  ...props
}) {
  return (
    <PremiumButton
      type={type}
      disabled={disabled}
      variant={variant}
      icon={Icon}
      className={className}
      {...props}
    >
      {children}
    </PremiumButton>
  );
}

export function ChefPageHero({
  title,
  subtitle,
  action = null,
  icon: Icon = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-slate-900 shadow-sm sm:px-10 dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none"
    >
      <div className="absolute -top-24 -right-24 hidden h-64 w-64 rounded-full bg-sky-100 blur-3xl dark:block dark:bg-white/10" />
      <div className="absolute -bottom-24 -left-24 hidden h-64 w-64 rounded-full bg-blue-100 blur-3xl dark:block dark:bg-sky-400/20" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          {Icon ? (
            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="inline-flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:shadow-none"
            >
              <Icon className="h-10 w-10" />
            </motion.div>
          ) : null}
          <div className="pt-2">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, ease: "easeOut" }}
              className="text-4xl font-extrabold tracking-tight sm:text-[2.6rem]"
            >
              {title}
            </motion.h1>
            {subtitle ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-blue-100"
              >
                {subtitle}
              </motion.p>
            ) : null}
          </div>
        </div>
        {action ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="shrink-0 pt-2"
          >
            {action}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function ChefSection({
  title,
  subtitle,
  action = null,
  className = "",
  children,
  delay = 0,
}) {
  return (
    <PremiumCard
      delay={delay}
      hover={false}
      className={cn("rounded-[32px] p-6 sm:p-8", className)}
    >
      {(title || subtitle || action) && (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            {title ? (
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 dark:text-slate-100">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-300">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </PremiumCard>
  );
}

export function ChefStatCard({
  label,
  value,
  helper = "",
  icon: Icon = null,
  tone = "blue",
  trend = "",
  className = "",
  index = 0,
}) {
  const tTone = {
    blue: "default",
    violet: "brand",
    green: "default",
    orange: "amber",
    red: "rose",
    slate: "default",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="h-full"
    >
      <PremiumCard className="hover-card relative overflow-hidden h-full flex flex-col justify-between group p-6">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-90",
            tone === "blue"
              ? "from-blue-500 to-indigo-500"
              : tone === "violet"
                ? "from-violet-500 to-fuchsia-500"
                : tone === "green"
                  ? "from-emerald-400 to-teal-500"
                  : tone === "orange"
                    ? "from-amber-400 to-orange-500"
                    : tone === "red"
                      ? "from-rose-400 to-red-500"
                      : "from-slate-400 to-slate-600",
          )}
        />

        <div className="flex items-start justify-between gap-4">
          <p className="text-[13px] font-bold uppercase tracking-widest text-slate-800 transition-colors duration-300 dark:text-slate-100">
            {label}
          </p>
          <div
            className={cn(
              "relative z-10 flex h-12 w-12 items-center justify-center rounded-[18px] shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
              TONE_STYLES[tone] || TONE_STYLES.blue,
            )}
          >
            {Icon ? <Icon className="h-6 w-6" /> : null}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-end gap-3">
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                delay: 0.2 + index * 0.05,
              }}
              className="text-[2.5rem] font-black tracking-tighter leading-none text-slate-900 transition-colors duration-300 dark:text-white"
            >
              {value}
            </motion.p>
            {trend ? (
              <span className="mb-1 text-sm font-bold text-emerald-500">
                {trend}
              </span>
            ) : null}
          </div>
          {helper ? (
            <p className="mt-2 text-sm font-medium text-slate-600 transition-colors duration-300 dark:text-slate-400">
              {helper}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.15]",
            tone === "blue"
              ? "bg-blue-500"
              : tone === "violet"
                ? "bg-violet-500"
                : tone === "green"
                  ? "bg-emerald-500"
                  : tone === "orange"
                    ? "bg-orange-500"
                    : tone === "red"
                      ? "bg-red-500"
                      : "bg-slate-500",
          )}
        />
      </PremiumCard>
    </motion.div>
  );
}

export function ChefAlertBanner({ tone = "info", title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={cn(
        "overflow-hidden rounded-[20px] border px-5 py-4 backdrop-blur-md shadow-sm dark:shadow-none",
        ALERT_STYLES[tone] || ALERT_STYLES.info,
      )}
    >
      <p className="text-base font-bold">{title}</p>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed opacity-90">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}

export function ChefBadge({ children, tone = "slate", className = "", tooltip = "" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider hover-badge",
        TONE_STYLES[tone] || TONE_STYLES.slate,
        className,
      )}
      {...(tooltip ? { "data-tooltip": tooltip } : {})}
    >
      {children}
    </span>
  );
}

export function ChefProgress({
  value = 0,
  max = 100,
  tone = "blue",
  label = "",
  rightLabel = "",
}) {
  const percent =
    max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const barTone = {
    blue: "from-blue-400 to-blue-600",
    violet: "from-violet-400 to-violet-600",
    green: "from-emerald-400 to-emerald-600",
    orange: "from-amber-400 to-orange-600",
    red: "from-rose-400 to-rose-600",
    slate: "from-slate-400 to-slate-600",
  };

  return (
    <div className="space-y-2.5">
      {(label || rightLabel) && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-slate-900 transition-colors duration-300 dark:text-slate-100">
            {label}
          </span>
          <span className="font-medium text-slate-600 transition-colors duration-300 dark:text-slate-400">
            {rightLabel}
          </span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 shadow-inner transition-colors duration-300 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-sm",
            barTone[tone] || barTone.blue,
          )}
        />
      </div>
    </div>
  );
}

export function ChefSearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
}) {
  return (
    <label
      className={cn(
        "flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition-colors duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/10 dark:bg-slate-900/50",
        className,
      )}
    >
      <Search className="h-5 w-5 text-slate-400 transition-colors duration-300 dark:text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 transition-colors duration-300 dark:text-white dark:placeholder:text-slate-500"
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
              "hover-action rounded-2xl px-5 py-3 text-base font-medium transition duration-300",
              isActive
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:shadow-none"
                : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
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
    <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_18px_36px_var(--color-shadow)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function ChefEmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80">
      <h3 className="text-lg font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 transition-colors duration-300 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ChefLoadingState({ label = "Chargement..." }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-slate-200 bg-white transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 transition-colors duration-300 dark:text-slate-400">
        <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 dark:border-white/10 dark:border-t-blue-400" />
        {label}
      </div>
    </div>
  );
}

export function ChefField({ label, help = "", error = "", children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
        {label}
      </span>
      {children}
      {help ? (
        <p className="text-xs text-slate-600 transition-colors duration-300 dark:text-slate-400">
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-semibold text-rose-600 transition-colors duration-300 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export function ChefInput(props) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500",
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
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-900/50 dark:text-white",
        props.className,
      )}
    />
  );
}

export function ChefCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 dark:border-slate-600"
      />
      {label}
    </label>
  );
}

export function ChefModal({
  open,
  title,
  subtitle = "",
  children,
  footer = null,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/12 p-4 backdrop-blur-sm dark:bg-slate-950/30">
      <div className="w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-md transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[1.65rem] font-bold text-slate-900 transition-colors duration-300 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-slate-600 transition-colors duration-300 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-colors duration-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
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
