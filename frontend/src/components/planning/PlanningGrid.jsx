import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock, MapPin, Users } from 'lucide-react';

const DAYS = [
  { id: 1, label: 'MON', full: 'Lundi' },
  { id: 2, label: 'TUE', full: 'Mardi' },
  { id: 3, label: 'WED', full: 'Mercredi' },
  { id: 4, label: 'THU', full: 'Jeudi' },
  { id: 5, label: 'FRI', full: 'Vendredi' },
];

const START_MINUTE = 8 * 60 + 30;
const END_MINUTE = 18 * 60 + 30;
const GRID_RANGE_MINUTES = END_MINUTE - START_MINUTE;

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

const minutesToTime = (totalVal) => {
  const hours = Math.floor(totalVal / 60);
  const m = Math.floor(totalVal % 60);
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

const generateTimeLabels = () => {
  const labels = [];
  for (let i = Math.ceil(START_MINUTE / 60); i <= Math.floor(END_MINUTE / 60); i++) {
    labels.push(`${String(i).padStart(2, '0')}:00`);
  }
  return labels;
};

export function SessionCard({ entry, canDrag, onClick }) {
  const startMins = timeToMinutes(entry.start_time);
  let duration = Number(entry.duration_minutes || 0);

  if (!duration && entry.duration_hours) {
    duration = Number(entry.duration_hours) * 60;
  }
  if (!duration && entry.start_time && entry.end_time) {
    duration = timeToMinutes(entry.end_time) - startMins;
  }
  if (!duration) {
    duration = 60;
  }

  const top = Math.max(0, ((startMins - START_MINUTE) / GRID_RANGE_MINUTES) * 100);
  const height = Math.min(100 - top, (duration / GRID_RANGE_MINUTES) * 100);

  const handleDragStart = (e) => {
    if (!canDrag) return;
    e.dataTransfer.setData('application/json', JSON.stringify({ id: entry.id }));
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick && onClick(entry)}
      className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm transition-all hover:z-10 hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:shadow-none"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        borderLeftColor: entry.accent || '#3b82f6',
        borderLeftWidth: '4px',
      }}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-tight text-slate-500 dark:text-slate-400">
            {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
            {entry.module_name || entry.task_title}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{entry.group_code}</span>
          </div>
          {entry.room_code && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10">
              <MapPin className="h-3 w-3" />
              <span>{entry.room_code}</span>
            </div>
          )}
        </div>

        {entry.change_request?.status === 'pending' && (
          <div className="absolute top-2 right-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanningGrid({
  entries = [],
  readonly = false,
  onSessionDrop,
  onSessionClick,
  onSlotClick,
}) {
  const containerRef = useRef(null);
  const timeLabels = useMemo(() => generateTimeLabels(), []);

  const entriesByDay = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    entries.forEach((e) => {
      const day = Number(e.day_of_week);
      if (map[day]) map[day].push(e);
    });
    return map;
  }, [entries]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dayId) => {
    e.preventDefault();
    if (readonly || !onSessionDrop) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { id } = JSON.parse(dataStr);
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percentage = y / rect.height;
      const droppedMinutes = START_MINUTE + percentage * GRID_RANGE_MINUTES;

      const roundedMinutes = Math.round(droppedMinutes / 30) * 30;
      
      let duration = Number(entry.duration_minutes || 0);
      if (!duration && entry.duration_hours) duration = Number(entry.duration_hours) * 60;
      if (!duration && entry.start_time && entry.end_time) duration = timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time);
      if (!duration) duration = 60;
      
      const clampedMinutes = Math.max(START_MINUTE, Math.min(END_MINUTE - duration, roundedMinutes));
      const newTime = minutesToTime(clampedMinutes);
      
      const endTime = minutesToTime(clampedMinutes + duration);

      if (entry.day_of_week === dayId && entry.start_time === newTime) return;

      onSessionDrop({
        ...entry,
        day_of_week: dayId,
        start_time: newTime,
        end_time: endTime,
      });
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  const handleGridClick = (e, dayId) => {
    if (readonly || !onSlotClick) return;
    
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = y / rect.height;
    const clickedMinutes = START_MINUTE + percentage * GRID_RANGE_MINUTES;
    const roundedMinutes = Math.round(clickedMinutes / 60) * 60;
    const newTime = minutesToTime(Math.max(START_MINUTE, Math.min(END_MINUTE - 120, roundedMinutes)));
    
    onSlotClick(dayId, newTime);
  };

  return (
    <div className="flex h-[750px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/50">
      <div className="w-16 shrink-0 border-r border-slate-100 bg-slate-50 py-12 dark:border-white/5 dark:bg-slate-900/80">
        <div className="relative h-full">
          {timeLabels.map((time) => {
            const m = timeToMinutes(time);
            const top = ((m - START_MINUTE) / GRID_RANGE_MINUTES) * 100;
            return (
              <div
                key={time}
                className="absolute block w-full -translate-y-1/2 text-right pr-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500"
                style={{ top: `${top}%` }}
              >
                {time}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 divide-x divide-slate-100 overflow-x-auto dark:divide-white/5">
        {DAYS.map((day) => (
          <div key={day.id} className="flex min-w-[200px] flex-1 flex-col">
            <div className="border-b border-slate-100 bg-white py-4 text-center dark:border-white/5 dark:bg-transparent">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                {day.label}
              </p>
              <p className="mt-1 text-[16px] font-extrabold text-slate-900 dark:text-white">
                {day.full}
              </p>
            </div>
            
            <div
              className={`relative flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+')] bg-[length:100%_40px] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.id)}
              onClick={(e) => handleGridClick(e, day.id)}
            >
              {entriesByDay[day.id].map((entry) => (
                <SessionCard
                  key={entry.id}
                  entry={entry}
                  canDrag={!readonly}
                  onClick={onSessionClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
