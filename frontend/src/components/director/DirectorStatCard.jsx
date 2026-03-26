import React from 'react';
import DirectorSurface from './DirectorSurface';

export default function DirectorStatCard({
  icon: Icon,
  iconClassName = 'text-[#316cff]',
  iconWrapperClassName = 'bg-[#eef4ff]',
  label,
  value,
  hint,
  valueClassName = 'text-[#17233a]',
  children,
}) {
  return (
    <DirectorSurface className="p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          {Icon ? (
            <span className={['inline-flex h-12 w-12 items-center justify-center rounded-[16px]', iconWrapperClassName].join(' ')}>
              <Icon className={['h-6 w-6', iconClassName].join(' ')} />
            </span>
          ) : null}
          <div>
            <p className="text-[15px] text-[#66758f]">{label}</p>
            <p className={['mt-2 text-[46px] leading-none font-semibold', valueClassName].join(' ')}>{value}</p>
          </div>
        </div>
        {hint ? <p className="text-sm font-semibold text-[#0fb44b]">{hint}</p> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </DirectorSurface>
  );
}
