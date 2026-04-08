import React from 'react';
import { BookOpen, CalendarDays, Clock3, Edit3, GraduationCap, MapPinned, Trash2, Users } from 'lucide-react';
import IconButton from '../ui/IconButton';

function getAccentColor(seed) {
  const palette = [
    'from-[#2451ff] to-[#33b6ff]',
    'from-[#ff7a18] to-[#ffb347]',
    'from-[#16a34a] to-[#4ade80]',
    'from-[#7c3aed] to-[#c026d3]',
    'from-[#ef4444] to-[#fb7185]',
  ];

  return palette[Math.abs(Number(seed || 0)) % palette.length];
}

function frenchDay(dayOfWeek) {
  const map = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche',
  };

  return map[Number(dayOfWeek)] || 'Jour';
}

export default function PlanningCard({ entry, onEdit, onDelete }) {
  const accent = getAccentColor(entry?.module_id);

  return (
    <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-sm dark:backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white ${accent}`}>
            {entry?.task_title || 'Cours'}
          </div>
          <p className="mt-3 truncate text-[18px] font-bold text-[var(--color-text-soft)]">{entry?.formateur_nom}</p>
          <p className="mt-1 truncate text-[14px] text-[var(--color-text-muted)]">{entry?.module_code} · {entry?.module_nom}</p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={Edit3} label="Modifier planning" type="edit" size="sm" onClick={onEdit} />
          <IconButton icon={Trash2} label="Supprimer planning" type="delete" size="sm" onClick={onDelete} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-[20px] bg-[var(--color-card-muted)] px-4 py-3">
          <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-[14px] text-[var(--color-text-soft)]">{entry?.groupe_code || 'Sans groupe'}</span>
        </div>
        <div className="flex items-center gap-3 rounded-[20px] bg-[var(--color-card-muted)] px-4 py-3">
          <CalendarDays className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-[14px] text-[var(--color-text-soft)]">{frenchDay(entry?.day_of_week)}</span>
        </div>
        <div className="flex items-center gap-3 rounded-[20px] bg-[var(--color-card-muted)] px-4 py-3">
          <Clock3 className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-[14px] text-[var(--color-text-soft)]">
            {entry?.start_time?.slice(0, 5)} → {entry?.end_time?.slice(0, 5)}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-[20px] bg-[var(--color-card-muted)] px-4 py-3">
          <MapPinned className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-[14px] text-[var(--color-text-soft)]">{entry?.salle_code || 'Sans salle'}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 font-semibold text-[var(--color-primary)]">
          <BookOpen className="h-3.5 w-3.5" />
          {Math.round(Number(entry?.duration_minutes || 0))} min
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card-muted)] px-3 py-1.5 font-semibold text-[var(--color-text-muted)]">
          <GraduationCap className="h-3.5 w-3.5" />
          {entry?.status || 'scheduled'}
        </span>
      </div>
    </div>
  );
}
