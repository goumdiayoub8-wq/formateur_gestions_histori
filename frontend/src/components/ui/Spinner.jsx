import React from 'react';
import { cn } from '../../lib/cn';

export default function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500',
        className,
      )}
    />
  );
}
