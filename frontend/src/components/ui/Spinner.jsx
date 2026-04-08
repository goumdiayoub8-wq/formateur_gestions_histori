import React from 'react';
import { cn } from '../../lib/cn';

export default function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)]',
        className,
      )}
    />
  );
}
