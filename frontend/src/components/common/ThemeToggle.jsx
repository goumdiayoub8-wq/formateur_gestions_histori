import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/cn';
import useTheme from '../../theme/useTheme';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { isDark, isSaving, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={cn(
        'group relative inline-flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-600 shadow-sm backdrop-blur-none transition-all duration-200 hover:scale-[1.02] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:hover:bg-slate-800/70 dark:backdrop-blur-xl',
        compact ? 'h-10 w-10 rounded-full' : 'h-11 w-11 rounded-[16px]',
        isSaving && 'opacity-80',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0',
        )}
      />
      <span className="sr-only">{isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}</span>
    </button>
  );
}
