import React from 'react';

export default function DirectorSurface({ className = '', children }) {
  return (
    <section
      className={[
        'theme-card rounded-[24px] border shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}
