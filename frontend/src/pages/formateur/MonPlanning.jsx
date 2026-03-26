import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Check, ChevronLeft, ChevronRight, Clock3, MessageSquareText, X } from 'lucide-react';
import PlanningService from '../../services/planningService';
import Spinner from '../../components/ui/Spinner';
import useAcademicConfig from '../../hooks/useAcademicConfig';
import useExportPDF from '../../hooks/useExportPDF';
import { ACADEMIC_MAX_WEEKS, getAcademicWeekCount, getAcademicWeekRange } from '../../utils/dateUtils';
import IconButton from '../../components/ui/IconButton';
import ExportFormateurButton from '../../components/planning/ExportFormateurButton';
import {
  FormateurAlertCard,
  FormateurEmptyBlock,
  FormateurPanel,
  FormateurSectionHeader,
  FormateurStatCard,
} from '../../components/formateur/FormateurUI';

const SLOT_TEMPLATES = [
  { time_range: '08:30h-13:00h', duration: 5, room_code: 'SN-12' },
  { time_range: '14:00h-16:30h', duration: 2.5, room_code: 'SN-12' },
  { time_range: '10:45h-13:00h', duration: 2.5, room_code: 'SN-12' },
  { time_range: '14:00h-19:00h', duration: 5, room_code: 'SN-12' },
];

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}H` : `${numericValue.toFixed(1).replace(/\.0$/, '')}H`;
}

function buildEntries(modules, weekNumber) {
  let dayCursor = 0;
  let slotCursor = 0;
  const entries = [];

  modules.forEach((module, moduleIndex) => {
    const baseWeeklyHours = Number(module.weekly_hours || 0);
    const derivedWeeklyHours = baseWeeklyHours > 0
      ? baseWeeklyHours
      : Math.max(2.5, Math.min(10, Math.round((Number(module.volume_horaire || 0) / 12) * 2) / 2));
    let remaining = derivedWeeklyHours;

    while (remaining > 0) {
      const template = SLOT_TEMPLATES[slotCursor % SLOT_TEMPLATES.length];
      const sessionDuration = remaining >= 5 ? 5 : remaining >= 2.5 ? 2.5 : remaining;

      entries.push({
        id: `${module.id}-${weekNumber}-${dayCursor}-${slotCursor}`,
        module_id: module.id,
        day_label: DAY_LABELS[dayCursor % DAY_LABELS.length],
        module_name: module.intitule,
        group_code: module.group_codes?.[entries.length % Math.max(1, module.group_codes?.length || 1)] || 'DES101',
        time_range: template.time_range,
        duration_label: `${sessionDuration}h`,
        room_code: template.room_code,
        status_label: 'Planifie',
        accent: moduleIndex % 2 === 0 ? '#2c5a91' : '#8b3dff',
      });

      remaining = Math.max(0, remaining - sessionDuration);
      dayCursor += 1;
      slotCursor += 1;
    }
  });

  return entries;
}

export default function MonPlanning() {
  const [weekNumber, setWeekNumber] = useState(null);
  const [stats, setStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [visibility, setVisibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { exporting, exportSinglePlanning } = useExportPDF();
  const {
    config,
    loading: academicLoading,
    academicYearLabel,
    currentWeek,
    currentSemester,
    inStagePeriod,
    inExamPeriod,
    validation,
  } = useAcademicConfig();

  useEffect(() => {
    if (weekNumber !== null || academicLoading) {
      return;
    }

    setWeekNumber(Math.max(1, currentWeek ?? 1));
  }, [academicLoading, currentWeek, weekNumber]);

  useEffect(() => {
    if (weekNumber === null) {
      return undefined;
    }

    let mounted = true;

    const loadPlanning = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const [statsResponse, modulesResponse, visibilityResponse] = await Promise.all([
          PlanningService.getWeeklyStats(weekNumber),
          PlanningService.getMesModules(weekNumber),
          PlanningService.getTrainerVisibility(weekNumber),
        ]);

        if (!mounted) {
          return;
        }

        setStats(statsResponse);
        setModules(Array.isArray(modulesResponse) ? modulesResponse : []);
        setVisibility(visibilityResponse || null);
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || 'Impossible de charger le planning de la semaine.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPlanning();

    return () => {
      mounted = false;
    };
  }, [weekNumber]);

  const entries = useMemo(() => visibility?.schedule || buildEntries(modules, weekNumber), [modules, visibility, weekNumber]);
  const alerts = Array.isArray(visibility?.alerts) ? visibility.alerts : [];
  const hasValidAcademicConfig = Boolean(config && validation.isValid);
  const maxWeekNumber = useMemo(() => {
    if (!hasValidAcademicConfig) {
      return ACADEMIC_MAX_WEEKS;
    }

    return getAcademicWeekCount(config.start_date, config.end_date) || ACADEMIC_MAX_WEEKS;
  }, [config, hasValidAcademicConfig]);
  const weekLabel = `Semaine ${weekNumber ?? '-'}`;
  const weekRange = useMemo(() => {
    if (!weekNumber) {
      return 'Chargement du calendrier academique...';
    }

    if (!hasValidAcademicConfig) {
      return 'Calendrier academique non configure';
    }

    return getAcademicWeekRange(config.start_date, weekNumber);
  }, [config, hasValidAcademicConfig, weekNumber]);

  if (loading || weekNumber === null) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  const handleEntryDecision = async (entry, decision) => {
    try {
      setActionLoadingId(entry.id);
      setError('');
      setSuccess('');

      await PlanningService.requestEntryDecision({
        module_id: entry.module_id,
        groupe_code: entry.group_code,
        request_week: weekNumber,
        day_label: entry.day_label,
        time_range: entry.time_range,
        decision,
      });

      setSuccess(
        decision === 'accept'
          ? 'Votre acceptation a ete envoyee au chef de pôle et apparait maintenant en attente.'
          : 'Votre refus a ete envoye au chef de pôle et apparait maintenant en attente.',
      );
    } catch (submitError) {
      setError(submitError?.message || "Impossible d'envoyer cette action au chef de pôle.");
    } finally {
      setActionLoadingId('');
    }
  };

  const handleExportPlanning = async () => {
    try {
      setError('');
      setSuccess('');
      await exportSinglePlanning({
        trainer: {
          id: visibility?.profile?.id,
          name: visibility?.profile?.nom || 'Mon planning',
          specialite: visibility?.profile?.specialite || '',
          weeklyHours: visibility?.summary?.weekly_hours || stats?.weekly_hours || 0,
          entries,
        },
        weekNumber,
        weekRange: visibility?.week_range?.label || weekRange,
        academicYearLabel,
      });
      setSuccess('Le PDF de votre planning a ete telecharge avec succes.');
    } catch (exportError) {
      setError(exportError?.message || 'Impossible de generer le PDF de votre planning.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] bg-[#f7f9fd] px-6 py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eafbf0] text-[#18b45c]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold tracking-tight text-[#1f2a3d]">Mon Planning</h1>
                <p className="mt-1 text-[15px] text-[#73839c]">Emploi du temps de la semaine</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#24334f] shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                {academicYearLabel || 'Annee non definie'}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#24334f] shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                {currentSemester || '-'}
              </span>
              {inStagePeriod ? <span className="rounded-full bg-[#20c05c] px-3 py-1.5 font-semibold text-white">Stage</span> : null}
              {inExamPeriod ? <span className="rounded-full bg-[#ff9b1f] px-3 py-1.5 font-semibold text-white">Exam</span> : null}
            </div>
          </div>

          <div>
            <div className="text-right">
              <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#8d9bb0]">Semaine academique</p>
              <p className="mt-2 text-[24px] font-bold tracking-tight text-[#1f2a3d]">{weekNumber}</p>
            </div>
          </div>

          <ExportFormateurButton
            label="Exporter mon planning"
            position="bottom"
            size="md"
            onClick={handleExportPlanning}
            loading={exporting}
          />
        </div>
      </div>

      {error ? (
        <FormateurPanel className="px-6 py-5 text-[15px] font-semibold text-[#b54545]">{error}</FormateurPanel>
      ) : null}

      {success ? (
        <FormateurPanel className="border-[#bfe8cb] bg-[#effcf3] px-6 py-5 text-[15px] font-semibold text-[#1b7b48]">
          {success}
        </FormateurPanel>
      ) : null}

      {alerts.length ? (
        <FormateurPanel className="p-6">
          <FormateurSectionHeader
            title="Alertes Planning"
            description="Les alertes sont generees automatiquement a partir de votre planning hebdomadaire."
          />
          <div className="mt-6 space-y-4">
            {alerts.map((alert, index) => (
              <FormateurAlertCard key={`${alert.code || alert.message}-${index}`} alert={alert} />
            ))}
          </div>
        </FormateurPanel>
      ) : null}

      {!academicLoading && !config ? (
        <FormateurPanel className="border-[#ffe3ad] bg-[#fff8e9] px-6 py-5 text-[15px] font-medium text-[#9a6500]">
          Configurez l&apos;annee scolaire dans l&apos;espace directeur pour synchroniser le planning.
        </FormateurPanel>
      ) : null}

      {!academicLoading && config && !validation.isValid ? (
        <FormateurPanel className="border-[#ffd9d9] bg-[#fff5f5] px-6 py-5 text-[15px] font-medium text-[#d14343]">
          La configuration academique est invalide. Les semaines affichees peuvent etre incoherentes tant qu&apos;elle n&apos;est pas corrigee.
        </FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <FormateurStatCard
          icon={Clock3}
          iconClassName="bg-[#f1f4f7] text-[#365b87]"
          label="Total heures annuelles"
          value={`${Math.round(Number(stats?.annual_completed || 0))} / ${Math.round(Number(stats?.annual_target || 910))}`}
        />
        <FormateurStatCard
          icon={Calendar}
          iconClassName="bg-[#edf5ff] text-[#5b9bff]"
          label="Heures cette semaine"
          value={formatHourValue(visibility?.summary?.weekly_hours || stats?.weekly_hours || 0)}
        />
        <FormateurStatCard
          icon={BookOpen}
          iconClassName="bg-[#ecfbf0] text-[#2ab35d]"
          label="Modules assignes"
          value={stats?.assigned_modules || 0}
        />
        <FormateurStatCard
          icon={MessageSquareText}
          iconClassName="bg-[#fff8e8] text-[#efb61f]"
          label="Demandes en attente"
          value={stats?.pending_requests || 0}
        />
      </div>

      <FormateurPanel className="px-4 py-4">
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setWeekNumber((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-2 rounded-[12px] border border-[#dce5f1] bg-white px-4 py-2.5 text-[14px] font-medium text-[#263246] transition hover:bg-[#f9fbff]"
            >
              <ChevronLeft className="h-4 w-4" />
              Semaine precedente
            </button>
          </div>

          <div className="text-center">
            <p className="text-[15px] font-bold text-[#1f2a3d]">{weekLabel}</p>
            <p className="mt-1 text-[14px] text-[#7b8ca5]">{visibility?.week_range?.label || weekRange}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setWeekNumber((current) => Math.min(maxWeekNumber, current + 1))}
              className="inline-flex items-center gap-2 rounded-[12px] border border-[#dce5f1] bg-white px-4 py-2.5 text-[14px] font-medium text-[#263246] transition hover:bg-[#f9fbff]"
            >
              Semaine suivante
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </FormateurPanel>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Mon Planning Hebdomadaire" />

        {visibility?.daily_totals?.length ? (
          <div className="mt-6 grid gap-3 xl:grid-cols-5 md:grid-cols-3">
            {visibility.daily_totals.map((day) => (
              <div key={day.label} className="rounded-[18px] border border-[#dce5f3] bg-[#f7f9fd] px-4 py-4 text-center">
                <p className="text-[13px] text-[#7486a1]">{day.label}</p>
                <p className="mt-2 text-[18px] font-bold text-[#1d2a3f]">{day.display_hours}</p>
              </div>
            ))}
          </div>
        ) : null}

        {entries.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[14px] text-[#7b8ca5]">
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Jour</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Module</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Heure Debut</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Groupes</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Duree</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Salle</th>
                  <th className="border-b border-[#e7edf6] px-4 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-[#fafcff]">
                    <td className="border-b border-[#edf2f8] px-4 py-5 text-[15px] font-semibold text-[#253044]">
                      {entry.day_label}
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.accent }} />
                        <p className="text-[15px] text-[#3a4962]">{entry.module_name}</p>
                      </div>
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5 text-[15px] text-[#72839b]">
                      {entry.time_range}
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5 text-[15px] text-[#72839b]">
                      {entry.group_code}
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5 text-[15px] font-semibold text-[#2c5a91]">
                      {entry.duration_label}
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5 text-[15px] text-[#72839b]">
                      {entry.room_code}
                    </td>
                    <td className="border-b border-[#edf2f8] px-4 py-5">
                      <div className="flex items-center gap-2">
                        <IconButton
                          icon={Check}
                          label="Accepter ce creneau"
                          type="approve"
                          size="sm"
                          position="top"
                          disabled={actionLoadingId === entry.id}
                          onClick={() => handleEntryDecision(entry, 'accept')}
                        />
                        <IconButton
                          icon={X}
                          label="Refuser ce creneau"
                          type="danger"
                          size="sm"
                          position="top"
                          disabled={actionLoadingId === entry.id}
                          onClick={() => handleEntryDecision(entry, 'reject')}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <FormateurEmptyBlock
              title="Aucun creneau pour cette semaine"
              description="Naviguez vers une autre semaine ou verifiez vos affectations."
            />
          </div>
        )}
      </FormateurPanel>
    </div>
  );
}
