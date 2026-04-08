import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];

  if (currentPage > 3) {
    items.push('left-ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push('right-ellipsis');
  }

  items.push(totalPages);

  return items;
}

function PremiumPaginationButton({
  children,
  disabled = false,
  active = false,
  onClick,
  className = '',
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition duration-300',
        active
          ? 'border-blue-500 bg-blue-600 text-white shadow-sm dark:border-blue-400 dark:bg-blue-500 dark:shadow-none'
          : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-white/10',
        disabled && 'cursor-not-allowed opacity-45 shadow-none',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function PremiumTable({
  columns = [],
  children,
  minWidthClassName = 'min-w-[1120px]',
  footer = null,
  className = '',
}) {
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl', className)}>
      <div className="overflow-x-auto">
        <div className={minWidthClassName}>
          <table className="w-full table-fixed text-left transition-colors duration-300 [&_tbody_tr:nth-child(even)]:bg-slate-50 dark:[&_tbody_tr:nth-child(even)]:bg-white/[0.02] [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-200 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-300 [&_tbody_tr]:hover:bg-slate-50 dark:[&_tbody_tr]:border-white/[0.05] dark:[&_tbody_tr]:hover:bg-white/[0.02]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn('px-4 py-4', column.className)}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            {children}
          </table>
        </div>
      </div>
      {footer ? <div className="border-t border-slate-200 transition-colors duration-300 dark:border-white/10">{footer}</div> : null}
    </div>
  );
}

export function PremiumTableFooter({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemCount = 0,
  loading = false,
  onPageChange,
  pendingLabel = 'Recherche en cours...',
  readyLabel = '',
}) {
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
          {`Affichage de ${itemCount} element${itemCount > 1 ? 's' : ''}`}
        </p>
        <p className="text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
          {loading ? pendingLabel : readyLabel || `${totalItems} resultat${totalItems > 1 ? 's' : ''} au total`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PremiumPaginationButton
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Precedent
        </PremiumPaginationButton>

        {paginationItems.map((item) =>
          typeof item === 'number' ? (
            <PremiumPaginationButton
              key={`page-${item}`}
              active={item === currentPage}
              disabled={loading}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PremiumPaginationButton>
          ) : (
            <span
              key={item}
              className="inline-flex h-11 min-w-11 items-center justify-center px-1 text-sm font-semibold text-slate-400 transition-colors duration-300 dark:text-slate-500"
            >
              ...
            </span>
          ),
        )}

        <PremiumPaginationButton
          disabled={currentPage >= totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="gap-2"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </PremiumPaginationButton>
      </div>
    </div>
  );
}
