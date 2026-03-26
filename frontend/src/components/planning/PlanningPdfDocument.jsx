import React, { useMemo } from 'react';
import casablancaSettatLogo from '../../style/photos/Casablanca-Settat_VF.png';
import ofpptLogo from '../../style/photos/logo1 (1).png';

const DAY_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const SLOT_DEFINITIONS = [
  { label: '8H30 -----> 11H', start: '08:30', end: '11:00' },
  { label: '11H --------> 13H30', start: '11:00', end: '13:30' },
  { label: '13H30 -----> 16H', start: '13:30', end: '16:00' },
  { label: '16H --------> 18H30', start: '16:00', end: '18:30' },
];

function toMinutes(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/(\d{1,2})[:Hh](\d{2})/);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function parseEntryTime(entry) {
  const start = toMinutes(entry?.start_time || entry?.startTime);
  const end = toMinutes(entry?.end_time || entry?.endTime);

  if (start !== null && end !== null) {
    return { start, end };
  }

  const timeLabel = entry?.timeLabel || entry?.time_range || '';
  const matches = String(timeLabel).match(/(\d{1,2}[:Hh]\d{2}).*?(\d{1,2}[:Hh]\d{2})/);
  if (!matches) {
    return { start: null, end: null };
  }

  return {
    start: toMinutes(matches[1]),
    end: toMinutes(matches[2]),
  };
}

function getDayLabel(entry) {
  const rawDay = String(entry?.dayLabel || entry?.day_label || entry?.day_label_fr || '').trim();
  if (rawDay) {
    return rawDay.toUpperCase();
  }

  const dayOfWeek = Number(entry?.day_of_week);
  const dayMap = {
    1: 'LUNDI',
    2: 'MARDI',
    3: 'MERCREDI',
    4: 'JEUDI',
    5: 'VENDREDI',
    6: 'SAMEDI',
    7: 'DIMANCHE',
  };

  return dayMap[dayOfWeek] || 'LUNDI';
}

function pickSlotIndex(entry) {
  const { start, end } = parseEntryTime(entry);

  if (start === null || end === null) {
    return 0;
  }

  let bestIndex = 0;
  let bestOverlap = -1;

  SLOT_DEFINITIONS.forEach((slot, index) => {
    const slotStart = toMinutes(slot.start);
    const slotEnd = toMinutes(slot.end);
    const overlap = Math.max(0, Math.min(end, slotEnd) - Math.max(start, slotStart));

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function buildGrid(entries) {
  const grid = Object.fromEntries(
    DAY_ORDER.map((day) => [
      day,
      SLOT_DEFINITIONS.map(() => []),
    ]),
  );

  entries.forEach((entry) => {
    const dayLabel = getDayLabel(entry);
    if (!grid[dayLabel]) {
      return;
    }

    const slotIndex = pickSlotIndex(entry);
    grid[dayLabel][slotIndex].push(entry);
  });

  return grid;
}

function truncate(value, max = 34) {
  const text = String(value || '').trim();
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1)}…`;
}

function formatHour(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '0 Heure';
  }

  return `${Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1).replace(/\.0$/, '')} Heures`;
}

function findFirstGroup(entries) {
  const candidate = entries.find((entry) => entry?.groupLabel || entry?.groupe_code || entry?.group_code);
  return candidate?.groupLabel || candidate?.groupe_code || candidate?.group_code || 'INDIVIDUEL';
}

function StampSeal() {
  return (
    <div className="relative flex h-[112px] w-[112px] items-center justify-center rounded-full border-[4px] border-[#5b6fd6] text-center text-[10px] font-bold text-[#5b6fd6]">
      <div className="absolute inset-[10px] rounded-full border-2 border-[#5b6fd6]" />
      <div className="absolute inset-[26px] rounded-full border border-[#5b6fd6]" />
      <span className="px-3 leading-tight">Direction Pedagogique</span>
    </div>
  );
}

function CellContent({ entries }) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2 text-center text-[11px] font-semibold uppercase leading-[1.2] text-black">
      {entries.map((entry, index) => (
        <div key={`${entry.moduleLabel || entry.module_nom || entry.module_name}-${index}`} className="space-y-1">
          <p>FORMATEUR : {truncate(entry.formateur_nom || entry.formateurNom || entry.trainerName || 'FORMATEUR', 24)}</p>
          <p>SALLE : {truncate(entry.roomLabel || entry.salle_code || entry.room_code || 'NON DEFINIE', 24)}</p>
          <p>MODULE : {truncate(entry.moduleLabel || entry.module_nom || entry.module_name || entry.module_code || 'NON DEFINI', 24)}</p>
          {index < entries.length - 1 ? <div className="mx-auto mt-1 h-px w-20 bg-black/35" /> : null}
        </div>
      ))}
    </div>
  );
}

function HeaderCell({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-center border-r border-black px-2 py-2 text-center text-[12px] font-semibold text-black ${className}`}>
      {children}
    </div>
  );
}

export default function PlanningPdfDocument({
  trainer,
  weekNumber,
  weekRange,
  academicYearLabel,
  generatedAtLabel,
}) {
  const entries = Array.isArray(trainer?.entries) ? trainer.entries : [];
  const grid = useMemo(() => buildGrid(entries), [entries]);
  const weeklyHours = formatHour(trainer?.weeklyHours);
  const groupLabel = findFirstGroup(entries);
  const exportDate = generatedAtLabel.split(',')[0];

  return (
    <div style={{ width: 1122, backgroundColor: '#ffffff', padding: 20, color: '#000000', fontFamily: 'Arial, sans-serif' }}>
      <div className="border-[3px] border-black bg-white">
        <div className="grid grid-cols-[230px_1fr_230px] border-b-[3px] border-black">
          <div className="flex h-[86px] items-center justify-center border-r-[3px] border-black">
            <img src={casablancaSettatLogo} alt="Casablanca Settat" className="h-[62px] w-[62px] object-contain" />
          </div>
          <div className="flex h-[86px] flex-col items-center justify-center px-4 text-center">
            <p className="text-[16px] font-bold">مكتب التكوين المهني و إنعاش الشغل</p>
            <p className="mt-1 text-[13px] font-semibold">Office de la formation professionnelle et</p>
            <p className="text-[13px] font-semibold">de la promotion du travail</p>
          </div>
          <div className="flex h-[86px] items-center justify-center border-l-[3px] border-black">
            <img src={ofpptLogo} alt="OFPPT" className="h-[66px] w-[66px] object-contain" />
          </div>
        </div>

        <div className="px-4 py-2 text-center">
          <h1 className="text-[22px] font-bold text-[#3f7cc4]">Emplois du Temps du Groupe</h1>
          <p className="mt-1 text-[14px] font-bold text-[#f27424]">
            Emplois du temps applicable a partir du {exportDate}
          </p>
        </div>

        <div className="px-4 pb-3">
          <div className="grid grid-cols-[220px_1fr_260px] items-center gap-4">
            <div className="space-y-1 text-[12px] font-bold uppercase">
              <p>DRRSK / CMC RABAT</p>
              <p>POLE : {truncate(trainer?.specialite || 'FORMATION DIGITALE', 22)}</p>
              <p>GROUPE</p>
            </div>

            <div className="grid grid-cols-[130px_1fr_90px] items-center gap-1">
              <div className="border-2 border-black px-3 py-1 text-center text-[12px] font-bold uppercase">
                {groupLabel}
              </div>
              <div className="border-2 border-black px-3 py-1 text-center text-[12px] font-bold">
                Masse Horaire Hebdomadaire
              </div>
              <div className="px-2 text-center text-[12px] font-bold">{weeklyHours}</div>
            </div>

            <div className="justify-self-end border-2 border-black">
              <div className="border-b border-black bg-[#c7d9ec] px-4 py-1 text-center text-[12px] font-medium uppercase">
                Annee de formation
              </div>
              <div className="px-4 py-1 text-center text-[12px] font-bold">{academicYearLabel || '2025/2026'}</div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="border-[2px] border-black">
            <div className="grid grid-cols-[92px_repeat(4,1fr)] border-b-[2px] border-black">
              <div className="relative h-[52px] border-r-[2px] border-black bg-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_48%,black_49%,black_51%,transparent_52%)]" />
                <span className="absolute bottom-1 left-2 text-[12px] font-bold">Jours</span>
                <span className="absolute right-1 top-1 text-[12px] font-bold">Seance</span>
              </div>
              {SLOT_DEFINITIONS.map((slot, index) => (
                <HeaderCell key={slot.label} className={index === SLOT_DEFINITIONS.length - 1 ? 'border-r-0' : ''}>
                  {slot.label}
                </HeaderCell>
              ))}
            </div>

            {DAY_ORDER.map((day, dayIndex) => (
              <div
                key={day}
                className={`grid grid-cols-[92px_repeat(4,1fr)] ${dayIndex < DAY_ORDER.length - 1 ? 'border-b border-black' : ''}`}
              >
                <div className="flex min-h-[86px] items-center justify-center border-r-[2px] border-black bg-[#d9d9d9] px-2 text-center text-[12px] font-bold">
                  {day}
                </div>
                {SLOT_DEFINITIONS.map((slot, slotIndex) => (
                  <div
                    key={`${day}-${slot.label}`}
                    className={`min-h-[86px] bg-white ${slotIndex < SLOT_DEFINITIONS.length - 1 ? 'border-r border-black' : ''}`}
                  >
                    <CellContent entries={grid[day]?.[slotIndex] || []} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between px-4 pb-3 pt-1">
          <div>
            <p className="text-[11px] font-bold">
              N.B/ Le present emploi du temps peut subir un changement, si necessaire par la direction de l&apos;etablissement.
            </p>
            <p className="mt-5 text-[11px] font-bold">Semaine : {weekNumber || '-'} {weekRange ? `| ${weekRange}` : ''}</p>
          </div>

          <div className="flex items-end gap-6">
            <div className="text-[12px] font-bold">
              <p className="underline">La Direction:</p>
              <p className="mt-2">Fait a Temesna</p>
              <p>Le : {exportDate}</p>
            </div>
            <StampSeal />
          </div>
        </div>
      </div>
    </div>
  );
}
