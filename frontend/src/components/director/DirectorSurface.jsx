import React from 'react';

export default function DirectorSurface({ className = '', children }) {
  return (
    <section
      className={[
        'rounded-[24px] border border-[#dfe6f3] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.03)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}
