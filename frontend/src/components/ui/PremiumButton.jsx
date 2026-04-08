import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Loader2 } from 'lucide-react';

export function PremiumButton({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon: Icon,
  className,
  ...props 
}) {
  const variants = {
    primary: 'rounded-2xl border border-transparent bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm hover:brightness-105 dark:shadow-none',
    secondary: 'rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none dark:hover:bg-white/10',
    danger: 'rounded-2xl border border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm hover:brightness-105 dark:shadow-none',
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:ring-offset-0',
        variants[variant],
        isLoading ? 'pointer-events-none opacity-80' : '',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      
      <span className={cn(isLoading ? 'opacity-0' : 'opacity-100', 'transition-opacity duration-200')}>
        {children}
      </span>

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      )}
    </motion.button>
  );
}
