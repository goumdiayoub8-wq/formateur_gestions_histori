import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileDown, LoaderCircle } from 'lucide-react';
import PlanningService from '../../services/planningService';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import useAcademicConfig from '../../hooks/useAcademicConfig';
import useExportPDF from '../../hooks/useExportPDF';
import { SYSTEM_WEEK_MAX, getAcademicWeekCount } from '../../utils/dateUtils';
import { ChefToastViewport, useChefToasts } from '../../components/chef/ChefUI';
import PlanningCreateButton from '../../components/planning/PlanningCreateButton';
import PlanningCard from '../../components/planning/PlanningCard';
import PlanningModal from '../../components/planning/PlanningModal';
import ExportFormateurButton from '../../components/planning/ExportFormateurButton';
import PlanningGrid from '../../components/planning/PlanningGrid';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { Skeleton, SkeletonPremiumCard } from '../../components/ui/Skeleton';
import { PremiumTableFooter } from '../../components/ui/PremiumTable';
import { Avatar } from '../../components/ui/Avatar';

const PAGE_LIMIT = 5;

const tableBodyVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

function formatHour(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function SummaryCard({ label, value }) {
  return (
    <PremiumCard className="hover-card px-5 py-4" hover={false}>
      <p className="text-[14px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-[30px] font-bold tracking-tight text-[var(--color-text-soft)]">{value}</p>
    </PremiumCard>
  );
}

function AlertPill({ alert }) {
  const colorClassName =
    alert?.type === 'error'
      ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
      : alert?.type === 'warning'
        ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
        : 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200';

  return (
    <span className={`inline-flex rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-semibold ${colorClassName}`}>
      {alert?.message}
    </span>
  );
}

function EmptyCardState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-6 py-10 text-center text-[15px] text-[var(--color-text-muted)]">
      Aucun planning detaille pour cette semaine. Utilisez le bouton + pour creer un creneau.
    </div>
  );
}

function PlanningTeamTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`planning-team-skeleton-${index}`} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-28 rounded-full" /></td>
          <td className="px-4 py-4">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, dayIndex) => (
                <Skeleton key={dayIndex} className="h-10 rounded-2xl" />
              ))}
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32 rounded-2xl" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function PlanningSessionCardsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <div key={`planning-session-skeleton-${index}`} className="rounded-[24px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_78%,transparent)] px-5 py-5 backdrop-blur-xl">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-4 w-56 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getRealScheduleEntries(schedule = []) {
  return Array.isArray(schedule) ? schedule.filter((entry) => entry?.is_session) : [];
}

function buildExportTrainer(formateur, rows, sessions) {
  const trainerId = Number(formateur?.id || 0);
  const summaryRow = rows.find((row) => Number(row.id) === trainerId) || null;
  const trainerSessions = sessions.filter((session) => Number(session.formateur_id) === trainerId);
  const summaryEntries = getRealScheduleEntries(summaryRow?.schedule);
  const summaryWeeklyHours = summaryEntries.reduce((sum, entry) => sum + Number(entry.duration_hours || 0), 0);

  return {
    id: trainerId || summaryRow?.id || null,
    name: formateur?.nom || summaryRow?.nom || 'Formateur',
    specialite: formateur?.specialite || summaryRow?.specialite || '',
    weeklyHours: trainerSessions.length
      ? trainerSessions.reduce((sum, session) => sum + Number(session.duration_hours || 0), 0)
      : summaryWeeklyHours,
    entries: trainerSessions.length ? trainerSessions : summaryEntries,
  };
}

export default function PlanningChef() {
  const [weekNumber, setWeekNumber] = useState(null);
  const [teamMeta, setTeamMeta] = useState(null);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);
  const [modalOptions, setModalOptions] = useState({ modules: [], groups: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [error, setError] = useState('');
  const [exportTarget, setExportTarget] = useState('');
  const [selectedFormateurId, setSelectedFormateurId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionTotalItems, setSessionTotalItems] = useState(0);
  const [sessionTotalPages, setSessionTotalPages] = useState(1);
  const { config, loading: academicLoading, currentWeek, academicYearLabel } = useAcademicConfig();
  const { toasts, pushToast, dismissToast } = useChefToasts();
  const {
    exporting,
    exportStage,
    exportSinglePlanning,
    exportAllPlannings,
    exportAllPlanningsExcel,
    exportStatusLabel,
  } = useExportPDF();

  useEffect(() => {
    if (weekNumber !== null || academicLoading) {
      return;
    }

    setWeekNumber(Math.max(1, currentWeek ?? 1));
  }, [academicLoading, currentWeek, weekNumber]);

  const loadFormateurs = async () => {
    const response = await FormateurService.listPaginated({ page: 1, limit: PAGE_LIMIT });
    setFormateurs(Array.isArray(response?.data) ? response.data : []);
  };

  const loadSessionPage = async (targetWeek, targetFormateurId = null) => {
    const resolvedWeek = targetWeek ?? weekNumber;
    if (resolvedWeek === null) {
      return;
    }

    try {
      setSessionLoading(true);
      setError('');
      const payload = await PlanningService.getSessionsPage({
        week: resolvedWeek,
        page: 1,
        limit: 100,
        formateurId: targetFormateurId,
      });

      setSessionMeta(payload || null);
      setSessions(Array.isArray(payload?.data) ? payload.data : []);
      setSessionTotalItems(Number(payload?.total_items || 0));
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger le planning formateurs.');
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (weekNumber === null) {
      return;
    }

    setCurrentPage(1);
    setSessionPage(1);
  }, [weekNumber]);

  useEffect(() => {
    let active = true;

    const bootstrapPlanning = async () => {
      if (weekNumber === null) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        if (formateurs.length === 0) {
          await loadFormateurs();
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || 'Impossible de charger le planning formateurs.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrapPlanning();

    return () => {
      active = false;
    };
  }, [weekNumber]);

  useEffect(() => {
    const loadTeamVisibility = async () => {
      if (weekNumber === null) {
        return;
      }

      try {
        setTableLoading(true);
        setError('');
        const payload = await PlanningService.getTeamVisibilityPage({
          week: weekNumber,
          page: currentPage,
          limit: PAGE_LIMIT,
        });

        setTeamMeta(payload || null);
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setTotalItems(Number(payload?.total_items || 0));
        setTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
        setCurrentPage(Math.max(1, Number(payload?.current_page || currentPage)));
      } catch (loadError) {
        setError(loadError?.message || 'Impossible de charger le planning formateurs.');
      } finally {
        setTableLoading(false);
      }
    };

    loadTeamVisibility();
  }, [weekNumber, currentPage]);

  useEffect(() => {
    loadSessionPage(weekNumber, selectedFormateurId);
  }, [weekNumber, selectedFormateurId]);

  const maxWeekNumber = useMemo(() => {
    if (!config?.start_date || !config?.end_date) {
      return SYSTEM_WEEK_MAX;
    }

    return getAcademicWeekCount(config.start_date, config.end_date) || SYSTEM_WEEK_MAX;
  }, [config]);

  const summary = useMemo(
    () => ({
      planned_courses: Number(sessionMeta?.summary?.planned_courses || sessionTotalItems || 0),
      programmed_hours: Number(sessionMeta?.summary?.programmed_hours || 0),
      active_groups: Number(sessionMeta?.summary?.active_groups || 0),
      active_formateurs: Number(sessionMeta?.summary?.active_formateurs || 0),
    }),
    [sessionMeta, sessionTotalItems],
  );
  const weekRange = teamMeta?.week?.range?.label || 'Calendrier academique non configure';

  const openCreateModal = async () => {
    setModalEntry(null);
    setModalOptions({ modules: [], groups: [], rooms: [] });
    setSessionError('');
    setModalOpen(true);
  };

  const openEditModal = async (entry) => {
    setModalEntry(entry);
    setSessionError('');
    setModalOpen(true);

    if (entry?.formateur_id) {
      try {
        const options = await PlanningService.getSessionOptions(entry.formateur_id);
        setModalOptions(options || { modules: [], groups: [], rooms: [] });
      } catch (loadError) {
        setSessionError(loadError?.message || 'Impossible de charger les options de ce formateur.');
      }
    }
  };

  const handleTrainerChange = async (formateurId) => {
    try {
      setSessionError('');
      const options = await PlanningService.getSessionOptions(formateurId);
      setModalOptions(options || { modules: [], groups: [], rooms: [] });
    } catch (loadError) {
      setSessionError(loadError?.message || 'Impossible de charger les modules et salles.');
    }
  };

  const handleSaveSession = async (sessionPayload) => {
    try {
      setSessionSaving(true);
      setSessionError('');
      await PlanningService.savePlanningSession(sessionPayload);
      setModalOpen(false);
      setModalEntry(null);
      await Promise.all([
        loadSessionPage(weekNumber, selectedFormateurId),
        PlanningService.getTeamVisibilityPage({
          week: weekNumber,
          page: currentPage,
          limit: PAGE_LIMIT,
        }).then((payload) => {
          setTeamMeta(payload || null);
          setRows(Array.isArray(payload?.data) ? payload.data : []);
          setTotalItems(Number(payload?.total_items || 0));
          setTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
          setCurrentPage(Math.max(1, Number(payload?.current_page || currentPage)));
        }),
      ]);
    } catch (saveError) {
      setSessionError(saveError?.message || 'Impossible d enregistrer ce creneau.');
    } finally {
      setSessionSaving(false);
    }
  };

  const handleDeleteSession = async (entry) => {
    const confirmed = window.confirm('Supprimer ce creneau de planning ?');
    if (!confirmed) {
      return;
    }

    try {
      setSessionError('');
      await PlanningService.deletePlanningSession(entry.id);
      await Promise.all([
        loadSessionPage(weekNumber, selectedFormateurId),
        PlanningService.getTeamVisibilityPage({
          week: weekNumber,
          page: currentPage,
          limit: PAGE_LIMIT,
        }).then((payload) => {
          setTeamMeta(payload || null);
          setRows(Array.isArray(payload?.data) ? payload.data : []);
          setTotalItems(Number(payload?.total_items || 0));
          setTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
          setCurrentPage(Math.max(1, Number(payload?.current_page || currentPage)));
        }),
      ]);
    } catch (deleteError) {
      setSessionError(deleteError?.message || 'Impossible de supprimer ce creneau.');
    }
  };

  const handleExportAllPdf = async () => {
    try {
      setExportTarget('all');
      const trainers = (formateurs.length ? formateurs : rows).map((formateur) =>
        buildExportTrainer(formateur, rows, sessions),
      );
      await exportAllPlannings({
        trainers,
        weekNumber,
        weekRange,
        academicYearLabel,
      });
      pushToast({
        tone: 'success',
        title: 'Export PDF termine',
        description: 'Tous les plannings ont ete telecharges dans un seul document PDF.',
      });
    } catch (exportError) {
      pushToast({
        tone: 'danger',
        title: 'Export impossible',
        description: exportError?.message || 'Le PDF des plannings n a pas pu etre genere.',
      });
    } finally {
      setExportTarget('');
    }
  };

  const handleExportAllExcel = async () => {
    try {
      setExportTarget('all-excel');
      const trainers = (formateurs.length ? formateurs : rows).map((formateur) =>
        buildExportTrainer(formateur, rows, sessions),
      );
      await exportAllPlanningsExcel({
        trainers,
        weekNumber,
        weekRange,
        academicYearLabel,
      });
      pushToast({
        tone: 'success',
        title: 'Export Excel termine',
        description: 'Le fichier Excel reprend exactement le meme rendu que le document PDF.',
      });
    } catch (exportError) {
      pushToast({
        tone: 'danger',
        title: 'Export impossible',
        description: exportError?.message || 'Le fichier Excel du planning n a pas pu etre genere.',
      });
    } finally {
      setExportTarget('');
    }
  };

  const handleExportTrainerPdf = async (row) => {
    try {
      setExportTarget(`trainer-${row.id}`);
      await exportSinglePlanning({
        trainer: buildExportTrainer(row, rows, sessions),
        weekNumber,
        weekRange,
        academicYearLabel,
      });
      pushToast({
        tone: 'success',
        title: 'Planning exporte',
        description: `Le PDF de ${row.nom} a ete telecharge avec succes.`,
      });
    } catch (exportError) {
      pushToast({
        tone: 'danger',
        title: 'Export impossible',
        description: exportError?.message || 'Le PDF de ce formateur n a pas pu etre genere.',
      });
    } finally {
      setExportTarget('');
    }
  };

  if ((loading && formateurs.length === 0 && rows.length === 0 && sessions.length === 0) || weekNumber === null) {
    return (
      <div className="space-y-6">
        <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-36 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-9 w-64 bg-slate-100 dark:bg-white/10" />
            <Skeleton className="h-5 w-80 bg-slate-100 dark:bg-white/10" />
          </div>
        </PremiumCard>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonPremiumCard key={index} />
          ))}
        </div>
        <PremiumCard className="px-6 py-10 text-center" hover={false}>
          <Spinner className="mx-auto h-11 w-11 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">Chargement du planning d equipe...</p>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-7">
        <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
                Orchestration hebdomadaire
              </div>
              <h1 className="mt-4 text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">Gestion du planning</h1>
              <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-200">Planning annuel premium avec filtrage par semaine et vision equipe.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{academicYearLabel || 'Annee non definie'}</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">Semaine {weekNumber}</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{maxWeekNumber} semaines</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
            <PlanningCreateButton onClick={openCreateModal} />
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={exporting}
              className="hover-action inline-flex h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
            >
              {exporting && exportTarget === 'all' ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {exporting && exportTarget === 'all'
                ? exportStage === 'rendering'
                  ? 'Preparation PDF...'
                  : exportStage === 'saving'
                    ? 'Telechargement...'
                    : 'Assemblage PDF...'
                : 'Exporter PDF'}
            </button>
            <button
              type="button"
              onClick={handleExportAllExcel}
              disabled={exporting}
              className="hover-action inline-flex h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 text-[14px] font-semibold text-white shadow-sm transition duration-300 hover:brightness-105 dark:shadow-none"
            >
              {exporting && exportTarget === 'all-excel' ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {exporting && exportTarget === 'all-excel'
                ? exportStage === 'rendering'
                  ? 'Conversion exacte...'
                  : exportStage === 'saving'
                    ? 'Telechargement...'
                    : 'Preparation Excel...'
                : 'Exporter Excel'}
            </button>
          </div>
          </div>
        </PremiumCard>

        {error ? (
          <PremiumCard className="border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-5 py-4 text-[15px] font-semibold text-[var(--color-danger-text)]" hover={false}>
            {error}
          </PremiumCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <SummaryCard label="Cours planifies" value={summary.planned_courses || 0} />
          <SummaryCard label="Heures programmees" value={formatHour(summary.programmed_hours || 0)} />
          <SummaryCard label="Groupes actifs" value={summary.active_groups || 0} />
          <SummaryCard label="Formateurs actifs" value={summary.active_formateurs || 0} />
        </div>

        <PremiumCard className="px-5 py-4" hover={false}>
          <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setWeekNumber((current) => Math.max(1, current - 1))}
                className="hover-action inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-[14px] font-medium text-slate-700 transition-colors duration-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Semaine precedente
              </button>
            </div>

            <div className="text-center">
              <p className="text-[18px] font-bold text-slate-900 transition-colors duration-300 dark:text-white">Semaine {weekNumber}</p>
              <p className="mt-1 text-[14px] text-slate-600 transition-colors duration-300 dark:text-slate-400">{weekRange}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setWeekNumber((current) => Math.min(maxWeekNumber, current + 1))}
                className="hover-action inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-[14px] font-medium text-slate-700 transition-colors duration-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Semaine suivante
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </PremiumCard>

        <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/30">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Formateurs</h2>
              {selectedFormateurId && (
                <button 
                  onClick={() => setSelectedFormateurId(null)}
                  className="text-[12px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Voir tous
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {tableLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-6 w-6 border-slate-200 border-t-blue-500" />
                </div>
              ) : rows.length ? (
                rows.map((row) => {
                  const isSelected = selectedFormateurId === row.id;
                  const targetHours = Number(row.weekly_target_hours || 44);
                  const currentHours = getRealScheduleEntries(row.schedule).reduce((acc, curr) => acc + Number(curr.duration_hours || 0), 0);
                  const overbooked = currentHours > targetHours;

                  return (
                    <div
                      key={row.id}
                      onClick={() => setSelectedFormateurId(row.id)}
                      className={`hover-row relative cursor-pointer overflow-hidden rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 dark:bg-slate-800'
                          : 'border-slate-200 bg-white hover:border-blue-300 dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-white/20'
                      }`}
                    >
                      {overbooked && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-rose-500" />
                      )}
                      <div className="p-4 pl-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={row.nom} size={32} />
                            <h3 className={`font-bold text-[15px] ${overbooked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                              {row.nom}
                            </h3>
                          </div>
                          {overbooked && (
                            <span className="hover-badge flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" data-tooltip="Le formateur dépasse son quota d'heures hebdomadaire">
                              OVERBOOKED
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[12px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                          {row.specialite || 'SANS SPECIALITE'}
                        </p>

                        <div className="mt-4 flex items-center justify-between text-[13px] font-medium text-slate-500 dark:text-slate-400">
                          <span>Charge Hebdo</span>
                          <span className={`font-bold ${overbooked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {currentHours}h / {targetHours}h
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${overbooked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (currentHours / targetHours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-500">Aucun formateur.</div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
              <PremiumTableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemCount={rows.length}
                loading={tableLoading}
                onPageChange={setCurrentPage}
                pendingLabel="Chargement..."
              />
            </div>
          </div>

          <div className="min-w-0">
            <PremiumCard className="p-0 overflow-hidden" hover={false}>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-transparent">
                <div>
                  <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Planning de la semaine</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {selectedFormateurId 
                      ? `Vision filtree pour un formateur` 
                      : `Vision complete de tous les intervenants`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    {sessionTotalItems} sessions
                  </span>
                </div>
              </div>

              {sessionLoading && !sessions.length ? (
                <div className="flex h-[750px] items-center justify-center bg-slate-50/50 dark:bg-transparent">
                  <Spinner className="h-8 w-8 border-slate-200 border-t-blue-500" />
                </div>
              ) : (
                <PlanningGrid
                  entries={sessions}
                  readonly={false}
                  onSessionClick={openEditModal}
                  onSlotClick={(dayId, startTime) => {
                    if (selectedFormateurId) {
                      setModalEntry({ day_of_week: dayId, start_time: startTime, formateur_id: selectedFormateurId });
                    } else {
                      setModalEntry({ day_of_week: dayId, start_time: startTime });
                    }
                    setModalOptions({ modules: [], groups: [], rooms: [] });
                    if (selectedFormateurId) {
                       handleTrainerChange(selectedFormateurId);
                    }
                    setModalOpen(true);
                  }}
                  onSessionDrop={(updatedSession) => {
                    handleSaveSession(updatedSession);
                  }}
                />
              )}
            </PremiumCard>
          </div>
        </div>
      </div>

      <PlanningModal
        open={modalOpen}
        weekNumber={weekNumber}
        formateurs={formateurs}
        options={modalOptions}
        initialEntry={modalEntry}
        saving={sessionSaving}
        error={sessionError}
        onClose={() => {
          setModalOpen(false);
          setModalEntry(null);
          setSessionError('');
        }}
        onTrainerChange={handleTrainerChange}
        onSave={handleSaveSession}
      />
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
