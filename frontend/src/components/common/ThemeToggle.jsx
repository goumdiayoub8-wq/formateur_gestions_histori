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
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={cn(
        'theme-icon-button group relative inline-flex items-center justify-center',
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
