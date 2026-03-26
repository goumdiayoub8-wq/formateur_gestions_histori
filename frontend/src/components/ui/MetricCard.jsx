import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/cn';

export default function MetricCard({ icon: Icon, label, value, meta, tone = 'default' }) {
  const toneStyles = {
    default: 'from-slate-900 to-slate-700 text-white',
    brand: 'from-teal-500 to-cyan-500 text-slate-950',
    amber: 'from-amber-400 to-orange-400 text-slate-950',
    rose: 'from-rose-400 to-pink-400 text-slate-950',
  };

  return (
    <Card className="relative overflow-hidden p-0">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneStyles[tone] || toneStyles.default)} />
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
          {meta ? <p className="text-sm text-slate-400">{meta}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg shadow-slate-900/10">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
