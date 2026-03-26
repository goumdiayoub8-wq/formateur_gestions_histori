import React from 'react';

const toneClasses = {
  pending: 'bg-[#fff4cb] text-[#c57b00]',
  approved: 'bg-[#dffae8] text-[#169d4c]',
  rejected: 'bg-[#ffe0e0] text-[#e3342f]',
  revision: 'bg-[#fff0d8] text-[#d27a00]',
  success: 'bg-[#dffae8] text-[#169d4c]',
  danger: 'bg-[#ffe0e0] text-[#e3342f]',
  warning: 'bg-[#fff4cb] text-[#c57b00]',
  info: 'bg-[#e9f0ff] text-[#316cff]',
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
