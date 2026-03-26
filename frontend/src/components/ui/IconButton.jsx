import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const actionStyles = {
  add: {
    button:
      'bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500 hover:text-white',
    tooltip: 'bg-emerald-500 text-white',
  },
  create: {
    button:
      'bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500 hover:text-white',
    tooltip: 'bg-emerald-500 text-white',
  },
  edit: {
    button:
      'bg-blue-500/15 text-blue-600 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500 hover:text-white',
    tooltip: 'bg-blue-500 text-white',
  },
  update: {
    button:
      'bg-blue-500/15 text-blue-600 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500 hover:text-white',
    tooltip: 'bg-blue-500 text-white',
  },
  save: {
    button:
      'bg-blue-500/15 text-blue-600 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500 hover:text-white',
    tooltip: 'bg-blue-500 text-white',
  },
  delete: {
    button:
      'bg-rose-500/15 text-rose-600 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500 hover:text-white',
    tooltip: 'bg-rose-500 text-white',
  },
  danger: {
    button:
      'bg-rose-500/15 text-rose-600 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500 hover:text-white',
    tooltip: 'bg-rose-500 text-white',
  },
  approve: {
    button:
      'bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500 hover:text-white',
    tooltip: 'bg-emerald-500 text-white',
  },
  neutral: {
    button:
      'theme-icon-button bg-[var(--color-card-muted)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-border)] hover:bg-[var(--color-text)] hover:text-white',
    tooltip: 'bg-[var(--color-text)] text-white',
  },
  export: {
    button:
      'theme-icon-button bg-[var(--color-card-muted)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-border)] hover:bg-[var(--color-text)] hover:text-white',
    tooltip: 'bg-[var(--color-text)] text-white',
  },
  filter: {
    button:
      'theme-icon-button bg-[var(--color-card-muted)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-border)] hover:bg-[var(--color-text)] hover:text-white',
    tooltip: 'bg-[var(--color-text)] text-white',
  },
  refresh: {
    button:
      'theme-icon-button bg-[var(--color-card-muted)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-border)] hover:bg-[var(--color-text)] hover:text-white',
    tooltip: 'bg-[var(--color-text)] text-white',
  },
};

function getActionStyle(type) {
  return actionStyles[type] || actionStyles.neutral;
}

function tooltipPositionClasses(position) {
  if (position === 'bottom') {
    return 'left-1/2 top-full mt-3 -translate-x-1/2';
  }

  return 'left-1/2 bottom-full mb-3 -translate-x-1/2';
}

function BaseContent({
  icon: Icon,
  label,
  type,
  position = 'top',
  size = 'md',
  className,
  disabled,
}) {
  const palette = getActionStyle(type);
  const boxSize = size === 'sm' ? 'h-10 w-10 rounded-2xl' : 'h-11 w-11 rounded-[1.15rem]';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <span
      className={cn(
        'group relative inline-flex items-center justify-center shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70',
        disabled ? 'cursor-not-allowed opacity-50 shadow-none' : 'hover:scale-110 hover:shadow-[0_18px_36px_rgba(15,23,42,0.18)]',
        boxSize,
        palette.button,
        className,
      )}
    >
      <Icon className={cn(iconSize, 'transition-transform duration-300', !disabled && 'group-hover:scale-110')} />

      <span
        className={cn(
          'pointer-events-none absolute z-30 hidden rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-2xl',
          'opacity-0 transition-all duration-300 md:inline-flex',
          disabled ? '' : 'group-hover:opacity-100',
          position === 'bottom'
            ? 'group-hover:translate-y-1'
            : 'group-hover:-translate-y-1',
          tooltipPositionClasses(position),
          palette.tooltip,
        )}
      >
        {label}
      </span>
    </span>
  );
}

export default function IconButton({
  icon,
  label,
  type = 'neutral',
  variant,
  position = 'top',
  to,
  size = 'md',
  className,
  htmlType = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  const resolvedType =
    type !== 'neutral'
      ? type
      : variant === 'primary'
        ? 'add'
        : variant === 'danger'
          ? 'delete'
          : variant === 'ghost'
            ? 'neutral'
            : variant === 'secondary'
              ? 'neutral'
              : 'neutral';

  const content = (
    <BaseContent
      icon={icon}
      label={label}
      type={resolvedType}
      position={position}
      size={size}
      className={className}
      disabled={disabled}
    />
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={label}
        title={label}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={disabled ? 'pointer-events-none' : ''}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={htmlType}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
