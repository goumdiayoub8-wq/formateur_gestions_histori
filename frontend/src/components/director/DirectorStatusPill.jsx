import React from 'react';

const toneClasses = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
  revision: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
};

const labelMap = {
  pending: 'En attente',
  approved: 'Valide',
  rejected: 'Refuse',
  revision: 'A reviser',
};

export default function DirectorStatusPill({ status, children }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        toneClasses[status] || toneClasses.info,
      ].join(' ')}
    >
      {children || labelMap[status] || status}
    </span>
  );
}
