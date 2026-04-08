import React from "react";
import { cn } from "../../lib/cn";
import { motion } from "framer-motion";

export function Skeleton({ as: Component = motion.div, className, ...props }) {
  return (
    <Component
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className={cn(
        "rounded-md bg-slate-100 transition-colors duration-300 dark:bg-slate-800/70",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonPremiumCard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:backdrop-blur-xl">
      <Skeleton className="absolute inset-x-0 top-0 h-1.5 w-full rounded-none" />
      <div className="flex items-start justify-between gap-4 p-2 pb-0">
        <div className="space-y-4 w-full">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonChartPanel({ className = "" }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-10 w-24 rounded-2xl" />
      </div>
      <div className="mt-6 grid grid-cols-6 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
