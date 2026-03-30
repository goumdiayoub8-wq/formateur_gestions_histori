import React, { useEffect, useMemo, useState } from 'react';
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

function formatHour(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-5 py-4 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
      <p className="text-[14px] text-[#5e728f]">{label}</p>
      <p className="mt-1 text-[30px] font-bold tracking-tight text-[#1b2437]">{value}</p>
    </div>
  );
}

function AlertPill({ alert }) {
  const colorClassName =
    alert?.type === 'error'
      ? 'bg-[#fff1f1] text-[#d64a4a]'
      : alert?.type === 'warning'
        ? 'bg-[#fff4df] text-[#d98400]'
        : 'bg-[#eaf2ff] text-[#2c62f0]';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClassName}`}>
      {alert?.message}
    </span>
  );
}

function EmptyCardState() {
  return (
    <div className="rounded-[16px] border border-dashed border-[#d3dfef] bg-[#f8fbff] px-6 py-10 text-center text-[15px] text-[#61748f]">
      Aucun planning detaille pour cette semaine. Utilisez le bouton + pour creer un creneau.
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
  const [payload, setPayload] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);
  const [modalOptions, setModalOptions] = useState({ modules: [], groups: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [error, setError] = useState('');
  const [exportTarget, setExportTarget] = useState('');
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

  const loadPage = async (targetWeek) => {
    const resolvedWeek = targetWeek ?? weekNumber;
    if (resolvedWeek === null) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [teamResponse, sessionsResponse, formateursResponse] = await Promise.all([
        PlanningService.getTeamVisibility(resolvedWeek),
        PlanningService.getSessions(resolvedWeek),
        FormateurService.list(),
      ]);

      setPayload(teamResponse || null);
      setSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);
      setFormateurs(Array.isArray(formateursResponse) ? formateursResponse : []);
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger le planning formateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [weekNumber]);

  const maxWeekNumber = useMemo(() => {
    if (!config?.start_date || !config?.end_date) {
      return SYSTEM_WEEK_MAX;
    }

    return getAcademicWeekCount(config.start_date, config.end_date) || SYSTEM_WEEK_MAX;
  }, [config]);

  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const summary = useMemo(() => {
    return {
      planned_courses: sessions.length,
      programmed_hours: sessions.reduce((sum, session) => sum + Number(session.duration_hours || 0), 0),
      active_groups: new Set(sessions.map((session) => session.groupe_id).filter(Boolean)).size,
      active_formateurs: new Set(sessions.map((session) => session.formateur_id).filter(Boolean)).size,
    };
  }, [sessions]);
  const weekRange = payload?.week?.range?.label || 'Calendrier academique non configure';

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
      await loadPage(weekNumber);
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
      await loadPage(weekNumber);
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

  if (loading || weekNumber === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#d9e9ff]">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#d9e9ff] px-5 py-5 lg:px-5">
      <div className="space-y-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1d2638]">Gestion du Planning</h1>
            <p className="mt-1 text-[16px] text-[#586d89]">Planning annuel - {maxWeekNumber} semaines</p>
          </div>

          <div className="flex items-center gap-3">
            <PlanningCreateButton onClick={openCreateModal} />
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={exporting}
              className="inline-flex h-[44px] items-center justify-center rounded-[16px] bg-[#dc2626] px-5 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(220,38,38,0.24)] transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-70"
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
              className="inline-flex h-[44px] items-center justify-center rounded-[16px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,0.25)] transition hover:bg-[#1f56cf]"
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

        {error ? (
          <div className="rounded-[22px] border border-[#ffd5d5] bg-white px-5 py-4 text-[15px] font-semibold text-[#c94949]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <SummaryCard label="Cours planifies" value={summary.planned_courses || 0} />
          <SummaryCard label="Heures programmees" value={formatHour(summary.programmed_hours || 0)} />
          <SummaryCard label="Groupes actifs" value={summary.active_groups || 0} />
          <SummaryCard label="Formateurs actifs" value={summary.active_formateurs || 0} />
        </div>

        <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-5 py-4 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
          <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setWeekNumber((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1f2738]"
              >
                <ChevronLeft className="h-4 w-4" />
                Semaine precedente
              </button>
            </div>

            <div className="text-center">
              <p className="text-[18px] font-bold text-[#1c2436]">Semaine {weekNumber}</p>
              <p className="mt-1 text-[14px] text-[#7d8798]">{weekRange}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setWeekNumber((current) => Math.min(maxWeekNumber, current + 1))}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1f2738]"
              >
                Semaine suivante
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-6 py-6 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#1c2436]">Creneaux detailes</h2>
              <p className="mt-1 text-[14px] text-[#6b7d96]">Chaque entree est editable et supprime directement depuis sa carte.</p>
            </div>
            <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[12px] font-semibold text-[#2d5cff]">
              {sessions.length} creneaux
            </span>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {sessions.length ? (
              sessions.map((entry) => (
                <PlanningCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => openEditModal(entry)}
                  onDelete={() => handleDeleteSession(entry)}
                />
              ))
            ) : (
              <div className="xl:col-span-2">
                <EmptyCardState />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-6 py-6 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
          <h2 className="text-[17px] font-bold text-[#1c2436]">Planning Formateurs</h2>

          <div className="mt-6 space-y-4">
            {rows.length ? (
              rows.map((row) => {
                const realScheduleEntries = getRealScheduleEntries(row.schedule);
                const realScheduleCount = realScheduleEntries.length;
                const realWeeklyHours = realScheduleEntries.reduce(
                  (sum, entry) => sum + Number(entry.duration_hours || 0),
                  0,
                );

                return (
                  <div key={row.id} className="rounded-[16px] border border-[#dde6f1] bg-white px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[15px] font-bold uppercase tracking-[0.01em] text-[#1b1f29]">{row.nom}</p>
                        {row.specialite ? <p className="mt-1 text-[13px] text-[#6e7c92]">{row.specialite}</p> : null}
                      </div>

                      <span className="inline-flex rounded-full bg-[#070a24] px-3 py-1.5 text-[13px] font-semibold text-white">
                        {formatHour(realWeeklyHours)} / {formatHour(row.display_capacity_hours)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-[13px] text-[#6e7c92]">
                        {realScheduleCount} creneaux detectes cette semaine
                      </div>
                      <ExportFormateurButton
                        label="Exporter ce formateur"
                        loadingLabel={exportStatusLabel}
                        position="top"
                        size="sm"
                        onClick={() => handleExportTrainerPdf(row)}
                        disabled={realScheduleCount === 0}
                        loading={exporting && exportTarget === `trainer-${row.id}`}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-5">
                      {row.daily_hours.map((day) => (
                        <div key={`${row.id}-${day.label}`} className="text-center">
                          <p className="mb-2 text-[14px] text-[#596b84]">{day.label}</p>
                          <div className="rounded-[6px] border border-[#b8d3ff] bg-[#edf5ff] py-2 text-[15px] font-semibold text-[#212939]">
                            {day.display_hours}
                          </div>
                        </div>
                      ))}
                    </div>

                    {row.alerts?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {row.alerts.map((alert, index) => (
                          <AlertPill key={`${row.id}-alert-${index}`} alert={alert} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-[16px] border border-dashed border-[#d3dfef] bg-[#f8fbff] px-6 py-10 text-center text-[15px] text-[#61748f]">
                Aucun planning n est encore disponible pour cette semaine.
              </div>
            )}
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
