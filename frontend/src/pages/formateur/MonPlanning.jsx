import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Check, ChevronLeft, ChevronRight, Clock3, MessageSquareText, X } from 'lucide-react';
import PlanningService from '../../services/planningService';
import useAcademicConfig from '../../hooks/useAcademicConfig';
import useExportPDF from '../../hooks/useExportPDF';
import { SYSTEM_WEEK_MAX, getAcademicWeekCount, getAcademicWeekRange } from '../../utils/dateUtils';
import IconButton from '../../components/ui/IconButton';
import ExportFormateurButton from '../../components/planning/ExportFormateurButton';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { Skeleton, SkeletonPremiumCard } from '../../components/ui/Skeleton';
import PlanningGrid from '../../components/planning/PlanningGrid';
import {
  FormateurAlertCard,
  FormateurEmptyBlock,
  FormateurPanel,
  FormateurSectionHeader,
  FormateurStatCard,
} from '../../components/formateur/FormateurUI';

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}H` : `${numericValue.toFixed(1).replace(/\.0$/, '')}H`;
}

function getEntryDisplayStatus(entry, localDecision) {
  const sessionStatus = String(entry?.status || '').toLowerCase();
  const requestStatus = String(entry?.change_request?.status || '').toLowerCase();
  const requestDecision = String(localDecision || entry?.change_request?.decision || '').toLowerCase();

  if (sessionStatus === 'completed' || sessionStatus === 'done') {
    return {
      label: 'Realise',
      className: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
    };
  }

  if (requestStatus === 'pending' || localDecision) {
    if (requestDecision === 'accept') {
      return {
        label: 'Acceptation en attente',
        className: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-primary)]',
      };
    }

    if (requestDecision === 'reject') {
      return {
        label: 'Refus en attente',
        className: 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
      };
    }

    return {
      label: 'En attente chef',
      className: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-primary)]',
    };
  }

  if (requestStatus === 'rejected') {
    return {
      label: 'Refuse',
      className: 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
    };
  }

  if (requestStatus === 'validated') {
    return {
      label: 'Valide',
      className: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
    };
  }

  if (requestStatus === 'planned') {
    return {
      label: 'Planifie par chef',
      className: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
    };
  }

  return {
    label: 'Planifie',
    className: 'border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] text-[var(--color-text-muted)]',
  };
}

const PAGE_LIMIT = 5;

function PlanningEntriesSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`formateur-planning-skeleton-${index}`}>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-20 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-44 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-28 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-20 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-14 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5"><Skeleton className="h-4 w-16 rounded-full" /></td>
          <td className="border-b border-[var(--color-border)] px-4 py-5">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function MonPlanning() {
  const academicConfigEnabled = true;
  const [weekNumber, setWeekNumber] = useState(null);
  const [stats, setStats] = useState(null);
  const [visibility, setVisibility] = useState(null);
  const [decisionStateByEntryId, setDecisionStateByEntryId] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [entryPage, setEntryPage] = useState(1);
  const [entryTotalItems, setEntryTotalItems] = useState(0);
  const [entryTotalPages, setEntryTotalPages] = useState(1);
  const { exporting, exportSinglePlanning, exportStatusLabel } = useExportPDF();
  const {
    config,
    loading: academicLoading,
    academicYearLabel,
    currentWeek,
    currentSemester,
    inStagePeriod,
    inExamPeriod,
    validation,
  } = useAcademicConfig({ enabled: academicConfigEnabled });

  const loadPlanning = async (targetWeek = weekNumber, targetPage = entryPage) => {
    const resolvedWeek = Number(targetWeek ?? weekNumber ?? currentWeek ?? 1);
    const firstLoad = !stats && !visibility;

    try {
      if (firstLoad) {
        setLoading(true);
      }
      setTableLoading(true);
      setError('');
      setSuccess('');

      const [statsResponse, visibilityResponse] = await Promise.all([
        PlanningService.getWeeklyStats(resolvedWeek),
        PlanningService.getTrainerVisibilityPage({
          week: resolvedWeek,
          page: targetPage,
          limit: PAGE_LIMIT,
        }),
      ]);

      const payload = visibilityResponse?.visibility || visibilityResponse || null;

      setStats(statsResponse);
      setVisibility(payload);
      setEntryTotalItems(Number(visibilityResponse?.total_items || payload?.total_items || 0));
      setEntryTotalPages(Math.max(1, Number(visibilityResponse?.total_pages || payload?.total_pages || 1)));
      setEntryPage(Math.max(1, Number(visibilityResponse?.current_page || payload?.current_page || targetPage || 1)));
      setDecisionStateByEntryId({});
      setWeekNumber((current) => current ?? Number(statsResponse?.week || resolvedWeek || 1));
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger le planning de la semaine.');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (weekNumber !== null || academicLoading) {
      return;
    }

    setWeekNumber(Math.max(1, currentWeek ?? 1));
  }, [academicLoading, currentWeek, weekNumber]);

  useEffect(() => {
    if (weekNumber === null) {
      return;
    }
    loadPlanning(weekNumber ?? undefined, entryPage);
  }, [entryPage, weekNumber]);

  const entries = useMemo(
    () => {
      const source = Array.isArray(visibility?.data)
        ? visibility.data
        : Array.isArray(visibility?.schedule)
          ? visibility.schedule
          : [];

      return source.filter((entry) => entry?.is_session);
    },
    [visibility],
  );
  const allEntries = useMemo(
    () => (Array.isArray(visibility?.schedule) ? visibility.schedule.filter((entry) => entry?.is_session) : entries),
    [entries, visibility],
  );
  const alerts = Array.isArray(visibility?.alerts) ? visibility.alerts : [];
  const hasRealEntries = allEntries.length > 0;
  const hasValidAcademicConfig = Boolean(config && validation.isValid);
  const fallbackAcademicYear = Number(stats?.academic_year || 0);
  const displayAcademicYearLabel =
    academicYearLabel || (fallbackAcademicYear > 0 ? `${fallbackAcademicYear - 1}-${fallbackAcademicYear}` : '');
  const displayCurrentSemester = currentSemester || '-';
  const maxWeekNumber = useMemo(() => {
    if (!hasValidAcademicConfig) {
      return SYSTEM_WEEK_MAX;
    }

    return getAcademicWeekCount(config.start_date, config.end_date) || SYSTEM_WEEK_MAX;
  }, [config, hasValidAcademicConfig]);
  const weekLabel = `Semaine ${weekNumber ?? '-'}`;
  const weekRange = useMemo(() => {
    if (!weekNumber) {
      return 'Chargement du calendrier academique...';
    }

    if (!hasValidAcademicConfig) {
      return visibility?.week_range?.label || 'Calendrier academique non configure';
    }

    return getAcademicWeekRange(config.start_date, weekNumber);
  }, [config, hasValidAcademicConfig, visibility?.week_range?.label, weekNumber]);

  if ((loading && !visibility && !stats) || weekNumber === null) {
    return (
      <div className="space-y-6 pb-8">
        <PremiumCard className="overflow-hidden border border-slate-200 bg-white px-6 py-7 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-8 w-56 bg-slate-100 dark:bg-white/10" />
            <Skeleton className="h-5 w-72 bg-slate-100 dark:bg-white/10" />
          </div>
        </PremiumCard>
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonPremiumCard key={index} />
          ))}
        </div>
        <PremiumCard className="p-6" hover={false}>
          <div className="space-y-4">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-4 w-72 rounded-full" />
            <div className="grid gap-3 xl:grid-cols-5 md:grid-cols-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-20 rounded-[20px]" />
              ))}
            </div>
            <div className="rounded-3xl border border-[var(--color-border)]">
              <div className="grid grid-cols-7 gap-0 border-b border-slate-100 bg-slate-100 px-4 py-4 transition-colors duration-300 dark:border-white/10 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-sky-900">
                {Array.from({ length: 7 }, (_, index) => (
                  <Skeleton key={index} className="h-4 w-16 bg-slate-200 dark:bg-white/10" />
                ))}
              </div>
              <table className="w-full">
                <PlanningEntriesSkeleton />
              </table>
            </div>
          </div>
        </PremiumCard>
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
      setDecisionStateByEntryId((current) => ({
        ...current,
        [entry.id]: decision,
      }));
    } catch (submitError) {
      const message = submitError?.message || "Impossible d'envoyer cette action au chef de pôle.";

      if (/deja en attente/i.test(message)) {
        setDecisionStateByEntryId((current) => ({
          ...current,
          [entry.id]: decision,
        }));
      }

      setError(message);
    } finally {
      setActionLoadingId('');
    }
  };

  const handleCompleteSession = async (entry) => {
    try {
      setActionLoadingId(entry.id);
      setError('');
      setSuccess('');

      await PlanningService.completePlanningSession(entry.id);
      await loadPlanning(weekNumber);
      setSuccess('La seance a ete marquee comme realisee et la progression a ete mise a jour.');
    } catch (completionError) {
      setError(completionError?.message || 'Impossible de marquer cette seance comme realisee.');
    } finally {
      setActionLoadingId('');
    }
  };

  const canMarkCompleted = (entry) =>
    Boolean(entry?.is_session)
    && String(entry?.status || '').toLowerCase() === 'scheduled'
    && Boolean(entry?.session_date)
    && new Date(`${entry.session_date}T00:00:00`) <= new Date(new Date().toDateString());

  const hasLinkedRequest = (entry) => Boolean(entry?.change_request) || Boolean(decisionStateByEntryId[entry?.id]);
  const hasPendingDecision = (entry) =>
    Boolean(decisionStateByEntryId[entry?.id]) || String(entry?.change_request?.status || '').toLowerCase() === 'pending';
  const canReviewEntry = (entry) =>
    Boolean(entry?.is_session)
    && String(entry?.status || '').toLowerCase() === 'scheduled'
    && !hasPendingDecision(entry)
    && !hasLinkedRequest(entry);

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
          entries: allEntries,
        },
        weekNumber,
        weekRange: visibility?.week_range?.label || weekRange,
        academicYearLabel: displayAcademicYearLabel,
      });
      setSuccess('Le PDF de votre planning a ete telecharge avec succes.');
    } catch (exportError) {
      setError(exportError?.message || 'Impossible de generer le PDF de votre planning.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white px-6 py-7 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">Mon planning</h1>
                <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-200">Emploi du temps de la semaine</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">
                {displayAcademicYearLabel || 'Annee non definie'}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">
                {displayCurrentSemester}
              </span>
              {inStagePeriod ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 dark:bg-emerald-500 dark:text-white">Stage</span> : null}
              {inExamPeriod ? <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 dark:bg-amber-500 dark:text-white">Exam</span> : null}
            </div>
          </div>

          <div>
            <div className="text-right">
              <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Semaine academique</p>
              <p className="mt-2 text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">{weekNumber}</p>
            </div>
          </div>

          <ExportFormateurButton
            className="hover-action"
            label="Exporter mon planning"
            loadingLabel={exportStatusLabel}
            position="bottom"
            size="md"
            onClick={handleExportPlanning}
            disabled={!hasRealEntries}
            loading={exporting}
          />
        </div>
      </PremiumCard>

      {error ? (
        <FormateurPanel className="border-rose-200 bg-rose-50 px-6 py-5 text-[15px] font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{error}</FormateurPanel>
      ) : null}

      {success ? (
        <FormateurPanel className="border-emerald-200 bg-emerald-50 px-6 py-5 text-[15px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
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

      {academicConfigEnabled && !academicLoading && !config ? (
        <FormateurPanel className="border-amber-200 bg-amber-50 px-6 py-5 text-[15px] font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          Configurez l&apos;annee scolaire dans l&apos;espace directeur pour synchroniser le planning.
        </FormateurPanel>
      ) : null}

      {academicConfigEnabled && !academicLoading && config && !validation.isValid ? (
        <FormateurPanel className="border-rose-200 bg-rose-50 px-6 py-5 text-[15px] font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          La configuration academique est invalide. Les semaines affichees peuvent etre incoherentes tant qu&apos;elle n&apos;est pas corrigee.
        </FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <FormateurStatCard
          icon={Clock3}
          iconClassName="bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300"
          label="Total heures annuelles"
          value={`${Math.round(Number(stats?.annual_completed || 0))} / ${Math.round(Number(stats?.annual_target || 910))}`}
        />
        <FormateurStatCard
          icon={Calendar}
          iconClassName="bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200"
          label="Heures cette semaine"
          value={formatHourValue(visibility?.summary?.weekly_hours || stats?.weekly_hours || 0)}
        />
        <FormateurStatCard
          icon={BookOpen}
          iconClassName="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200"
          label="Modules assignes"
          value={stats?.assigned_modules || 0}
        />
        <FormateurStatCard
          className="hover-card"
          icon={MessageSquareText}
          iconClassName="bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
          label="Demandes en attente"
          value={stats?.pending_requests || 0}
        />
      </div>

      <PremiumCard className="px-4 py-4" hover={false}>
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => {
                setEntryPage(1);
                setWeekNumber((current) => Math.max(1, (current ?? 1) - 1));
              }}
              className="hover-action inline-flex items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text)] transition hover:bg-[var(--color-hover)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Semaine precedente
            </button>
          </div>

          <div className="text-center">
            <p className="text-[15px] font-bold text-[var(--color-text-soft)]">{weekLabel}</p>
            <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">{visibility?.week_range?.label || weekRange}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEntryPage(1);
                setWeekNumber((current) => Math.min(maxWeekNumber, (current ?? 1) + 1));
              }}
              className="hover-action inline-flex items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text)] transition hover:bg-[var(--color-hover)]"
            >
              Semaine suivante
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-6" hover={false}>
        <FormateurSectionHeader title="Mon Planning Hebdomadaire" />

        {hasRealEntries && visibility?.daily_totals?.length ? (
          <div className="mt-6 grid gap-3 xl:grid-cols-5 md:grid-cols-3">
            {visibility.daily_totals.map((day) => (
              <div key={day.label} className="hover-card rounded-[20px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-4 text-center">
                <p className="text-[13px] text-[var(--color-text-muted)]">{day.label}</p>
                <p className="mt-2 text-[18px] font-bold text-[var(--color-text-soft)]">{day.display_hours}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tableLoading ? (
          <div className="mt-6 flex h-[750px] items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900/50">
            <span className="inline-flex items-center gap-3 font-semibold text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"></span>
              Chargement du planning...
            </span>
          </div>
        ) : entries.length ? (
          <div className="mt-6">
            <PlanningGrid
              entries={entries}
              readonly={true}
              onSessionClick={(entry) => console.log('Session View', entry)}
            />
          </div>
        ) : (
          <div className="mt-6">
            <FormateurEmptyBlock
              title="Aucun creneau pour cette semaine"
              description="Naviguez vers une autre semaine ou verifiez vos affectations."
            />
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
