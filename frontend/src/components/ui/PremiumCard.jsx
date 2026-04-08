import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export function PremiumCard({
  className,
  children,
  delay = 0,
  hover = true,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-sm backdrop-blur-none",
        "transition-all duration-300 ease-out dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:shadow-none",
        "hover:border-slate-300 hover:shadow-md dark:hover:border-white/15 dark:hover:shadow-none dark:backdrop-blur-xl",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-slate-50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:before:from-white/6",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -inset-x-full top-0 h-full w-1/2 -skew-x-[30deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-1000 ease-in-out group-hover:translate-x-[300%]" />
      {children}
    </motion.div>
  );
}

export function PremiumMetricCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
  delay = 0,
}) {
  const toneStyles = {
    default: {
      accent: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
      soft: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200",
    },
    brand: {
      accent: "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600",
      soft: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200",
    },
    emerald: {
      accent: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600",
      soft: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200",
    },
    amber: {
      accent: "bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600",
      soft: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
    },
    rose: {
      accent: "bg-gradient-to-r from-rose-400 via-rose-500 to-pink-600",
      soft: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200",
    },
    purple: {
      accent: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600",
      soft: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200",
    },
  };
  const palette = toneStyles[tone] || toneStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-sm backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl"
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5", palette.accent)} />
      <div className="flex items-start justify-between gap-4 p-6 pt-7">
        <div className="space-y-3 z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 transition-colors duration-300 dark:text-slate-400">
            {label}
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: delay + 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-slate-950 transition-colors duration-300 dark:text-slate-100"
          >
            {value}
          </motion.p>
          {meta ? (
            <p className="text-sm font-medium text-slate-500 transition-colors duration-300 dark:text-slate-400">
              {meta}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:shadow-none",
              palette.soft,
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
        ) : null}
      </div>
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-slate-200 opacity-[0.18] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.24] dark:bg-white dark:opacity-[0.04] dark:group-hover:opacity-[0.06]" />
    </motion.div>
  );
}
