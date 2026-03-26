import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, CalendarDays, ClipboardCheck, Clock3, Users } from 'lucide-react';
import DashboardService from '../../services/dashboardService';
import PlanningService from '../../services/planningService';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import useAcademicConfig from '../../hooks/useAcademicConfig';
import useExportPDF from '../../hooks/useExportPDF';
import ExportFormateurButton from '../../components/planning/ExportFormateurButton';
import {
  FormateurEmptyBlock,
  FormateurAlertCard,
  FormateurPanel,
  FormateurSectionHeader,
  FormateurSemesterBadge,
  FormateurStatCard,
} from '../../components/formateur/FormateurUI';

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function ProgressCard({ progress, value, target }) {
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  const statusLabel = progress?.is_above_target ? "Au-dessus de l'objectif" : 'Progression en cours';

  return (
    <FormateurPanel className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-[#1f2a3d]">
            Progression Annuelle - Objectif {target} heures
          </h2>
          <p className="mt-2 text-[15px] text-[#7a8aa1]">
            {Math.round(Number(value || 0))} heures completees sur {target} heures cible
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-[36px] font-bold tracking-tight text-[#0ab14f]">{percent}%</p>
          <p className="text-[15px] text-[#7a8aa1]">{statusLabel}</p>
        </div>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#edf1f7]">
        <div className="h-full rounded-full bg-[#1e4dff]" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[13px] text-[#8c9bb0]">
        <span>0h</span>
        <span>{Math.round(Number(value || 0))} h</span>
        <span>{target}+ </span>
      </div>
    </FormateurPanel>
  );
}

function ModuleRow({ module }) {
  return (
    <div className="rounded-[20px] bg-[#f7f9fd] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-bold text-[#1d2a3f]">{module.code}</p>
          <p className="mt-1 text-[14px] text-[#5e708a]">{module.intitule}</p>
        </div>
        <FormateurSemesterBadge value={module.semestre} />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[14px] text-[#71839d]">
        <span>{formatHourValue(module.weekly_hours)}/sem</span>
        <span>•</span>
        <span>{formatHourValue(module.volume_horaire)} total</span>
      </div>
    </div>
  );
}

function GroupRow({ group }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#f7f9fd] px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-[#1d2a3f]">{group.code}</p>
        <p className="mt-1 truncate text-[14px] text-[#5e708a]">{group.nom}</p>
      </div>
      <p className="shrink-0 text-[15px] font-semibold text-[#1d2a3f]">{group.student_count} etudiants</p>
    </div>
  );
}

function PlanningDayChip({ day }) {
  return (
    <div className="rounded-[18px] border border-[#dce5f3] bg-[#f7f9fd] px-4 py-4 text-center">
      <p className="text-[13px] text-[#7486a1]">{day.label}</p>
      <p className="mt-2 text-[18px] font-bold text-[#1d2a3f]">{day.display_hours}</p>
    </div>
  );
}

function getEvaluationMeta(percentage) {
  const value = Number(percentage);

  if (!Number.isFinite(value)) {
    return {
      value: 'Non evalue',
      helper: 'Completez votre questionnaire d evaluation',
      progress: 0,
      progressClassName: 'bg-[#9aa9bd]',
      badgeClassName: 'bg-[#eef3f9] text-[#60748f]',
      message: 'Questionnaire en attente',
    };
  }

  if (value >= 75) {
    return {
      value: `${Math.round(value)}%`,
      helper: 'Excellent',
      progress: value,
      progressClassName: 'bg-[#16c55b]',
      badgeClassName: 'bg-[#eafaf0] text-[#119548]',
      message: 'Performance solide et reguliere',
    };
  }

  if (value >= 50) {
    return {
      value: `${Math.round(value)}%`,
      helper: 'Good',
      progress: value,
      progressClassName: 'bg-[#ff9b1f]',
      badgeClassName: 'bg-[#fff4e4] text-[#d97a00]',
      message: 'Bon niveau avec marge d amelioration',
    };
  }

  return {
    value: `${Math.round(value)}%`,
    helper: 'Needs improvement',
    progress: value,
    progressClassName: 'bg-[#ef4444]',
    badgeClassName: 'bg-[#fff1f1] text-[#cf4c4c]',
    message: 'Un accompagnement complementaire est recommande',
  };
}

export default function DashboardFormateur() {
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const [planningExportFeedback, setPlanningExportFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [overviewResponse, profileResponse, statsResponse, modulesResponse, notificationsResponse] = await Promise.all([
          DashboardService.getTrainerOverview(),
          FormateurService.getProfil(),
          PlanningService.getWeeklyStats(),
          PlanningService.getMesModules(),
          FormateurService.getNotifications(),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewResponse);
        setProfile(profileResponse);
        setWeeklyStats(statsResponse);
        setModules(Array.isArray(modulesResponse) ? modulesResponse : []);
        setNotificationSummary(notificationsResponse?.summary || null);
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || "Impossible de charger l'espace formateur.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const displayedModules = useMemo(() => {
    if (modules.length > 0) {
      return modules.slice(0, 4);
    }

    return overview?.modules?.slice(0, 4) || [];
  }, [modules, overview?.modules]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <FormateurPanel className="px-6 py-6 text-[15px] font-semibold text-[#b54545]">
        {error}
      </FormateurPanel>
    );
  }

  const annualHours = Number(overview?.stats?.annual_completed_hours || overview?.progress?.value || 0);
  const progressPercent = Math.round((annualHours / 910) * 100);
  const progress = {
    percent: Number.isFinite(progressPercent) ? progressPercent : 0,
    value: annualHours,
    target: 910,
    is_above_target: annualHours > 910,
  };
  const stats = {
    assigned_modules: weeklyStats?.assigned_modules ?? overview?.stats?.assigned_modules ?? 0,
    groups_count: overview?.stats?.groups_count ?? 0,
    weekly_hours: weeklyStats?.weekly_hours ?? overview?.stats?.weekly_hours ?? 0,
    notifications: notificationSummary?.total ?? 0,
  };
  const evaluation = overview?.evaluation || null;
  const evaluationMeta = getEvaluationMeta(evaluation?.percentage);
  const planning = overview?.planning || null;
  const planningAlerts = Array.isArray(overview?.alerts) ? overview.alerts : [];

  const handleExportPlanning = async () => {
    try {
      setPlanningExportFeedback(null);
      await exportSinglePlanning({
        trainer: {
          id: profile?.id || overview?.profile?.id,
          name: profile?.nom || overview?.profile?.nom || 'Mon planning',
          specialite: profile?.specialite || overview?.profile?.specialite || '',
          weeklyHours: stats.weekly_hours || 0,
          entries: planning?.schedule || [],
        },
        weekNumber: overview?.stats?.week ?? currentWeek,
        weekRange: planning?.week_range?.label || '',
        academicYearLabel,
      });
      setPlanningExportFeedback({
        tone: 'success',
        message: 'Le PDF de votre planning a ete telecharge avec succes.',
      });
    } catch (exportError) {
      setPlanningExportFeedback({
        tone: 'error',
        message: exportError?.message || 'Impossible de generer le PDF de votre planning.',
      });
    }
  };

  return (
    <div className="formateur-dashboard-page space-y-6 pb-8">
      <div className="rounded-[28px] bg-gradient-to-r from-[#8c15ff] via-[#c412d6] to-[#f10072] px-6 py-8 text-white shadow-[0_20px_50px_rgba(173,26,183,0.28)]">
        <h1 className="text-[22px] font-bold tracking-tight">
          Bienvenue Mr {profile?.nom || overview?.profile?.nom || 'Formateur'}
        </h1>
        <p className="mt-3 text-[15px] text-white/88">
          Voici votre planning et vos modules de formation
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">{academicYearLabel || 'Annee non definie'}</span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">Semaine {currentWeek ?? '-'}</span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">{currentSemester || '-'}</span>
          {inStagePeriod ? <span className="rounded-full bg-[#20c05c] px-3 py-1.5 font-semibold text-white">Stage</span> : null}
          {inExamPeriod ? <span className="rounded-full bg-[#ff9b1f] px-3 py-1.5 font-semibold text-white">Exam</span> : null}
        </div>
      </div>

      {!academicLoading && !config ? (
        <FormateurPanel className="border-[#ffe3ad] bg-[#fff8e9] px-6 py-5 text-[15px] font-medium text-[#9a6500]">
          Configurez l&apos;annee scolaire pour activer les calculs de semaine et de semestre.
        </FormateurPanel>
      ) : null}

      {!academicLoading && config && !validation.isValid ? (
        <FormateurPanel className="border-[#ffd9d9] bg-[#fff5f5] px-6 py-5 text-[15px] font-medium text-[#d14343]">
          La configuration academique est invalide. Les calculs de semaine et de semestre sont bloques tant qu&apos;elle n&apos;est pas corrigee.
        </FormateurPanel>
      ) : null}

      <ProgressCard progress={progress} value={progress.value} target={progress.target} />

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <FormateurStatCard
          icon={BookOpen}
          iconClassName="bg-[#f4edff] text-[#972dff]"
          label="Mes Modules"
          value={stats.assigned_modules}
        />
        <FormateurStatCard
          icon={Users}
          iconClassName="bg-[#eef4ff] text-[#2663ff]"
          label="Mes Groupes"
          value={stats.groups_count}
        />
        <FormateurStatCard
          icon={Clock3}
          iconClassName="bg-[#ecfbf1] text-[#07b34a]"
          label="Heures/semaine"
          value={formatHourValue(stats.weekly_hours)}
          progress={(Number(stats.weekly_hours || 0) / 26) * 100}
        />
        <FormateurStatCard
          icon={Bell}
          iconClassName="bg-[#fff4e9] text-[#ff6f1f]"
          label="Notifications"
          value={stats.notifications}
        />
        <FormateurStatCard
          icon={ClipboardCheck}
          iconClassName="bg-[#eef3ff] text-[#315cf0]"
          label="Mon Score"
          value={evaluationMeta.value}
          helper={evaluationMeta.helper}
          progress={evaluationMeta.progress}
          progressClassName={evaluationMeta.progressClassName}
        />
      </div>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader
          title="Visibilite Planning"
          description="Planning hebdomadaire, modules planifies et alertes automatiques pour cette semaine."
          action={
            <div className="flex items-center gap-3">
              <ExportFormateurButton
                label="Exporter mon planning"
                position="bottom"
                size="sm"
                onClick={handleExportPlanning}
                loading={exporting}
              />
              <Link
                to="/formateur/planning"
                className="inline-flex items-center rounded-[14px] bg-[#eef4ff] px-4 py-2.5 text-sm font-semibold text-[#315cf0]"
              >
                Voir le planning
              </Link>
            </div>
          }
        />

        {planningExportFeedback ? (
          <div
            className={`mt-4 rounded-[18px] border px-4 py-3 text-[14px] font-semibold ${
              planningExportFeedback.tone === 'success'
                ? 'border-[#cbead5] bg-[#effcf3] text-[#1b7b48]'
                : 'border-[#ffd8d8] bg-[#fff5f5] text-[#cf4c4c]'
            }`}
          >
            {planningExportFeedback.message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-5 md:grid-cols-3">
          {(planning?.daily_totals || []).length ? (
            planning.daily_totals.map((day) => <PlanningDayChip key={day.label} day={day} />)
          ) : (
            <div className="xl:col-span-5 md:col-span-3">
              <FormateurEmptyBlock
                title="Planning non defini"
                description="Aucune seance n est encore visible pour cette semaine."
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-[#edf3ff] px-3 py-1.5 font-semibold text-[#315cf0]">
            Semaine {overview?.stats?.week ?? currentWeek ?? '-'}
          </span>
          {planning?.periods?.semester ? (
            <span className="rounded-full bg-[#f5f6fb] px-3 py-1.5 font-semibold text-[#465775]">
              {planning.periods.semester}
            </span>
          ) : null}
          {(planning?.periods?.badges || []).map((badge) => (
            <span
              key={badge.label}
              className={`rounded-full px-3 py-1.5 font-semibold text-white ${badge.label === 'Stage' ? 'bg-[#20c05c]' : 'bg-[#ff9b1f]'}`}
            >
              {badge.label}
            </span>
          ))}
          {planning?.week_range?.label ? (
            <span className="rounded-full bg-[#f5f7fb] px-3 py-1.5 font-semibold text-[#6e7f96]">
              {planning.week_range.label}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[22px] bg-[#f7f9fd] px-5 py-5">
            <p className="text-[14px] text-[#7486a1]">Total hebdomadaire</p>
            <p className="mt-2 text-[30px] font-bold text-[#1d2a3f]">{formatHourValue(stats.weekly_hours)}</p>
            <p className="mt-2 text-[14px] text-[#7486a1]">
              {planning?.schedule?.length || 0} creneaux planifies
            </p>
          </div>
          <div className="rounded-[22px] bg-[#f7f9fd] px-5 py-5">
            <p className="text-[14px] text-[#7486a1]">Modules et taches</p>
            <div className="mt-3 space-y-2">
              {(planning?.schedule || []).slice(0, 3).map((entry) => (
                <div key={entry.id} className="rounded-[16px] bg-white px-4 py-3">
                  <p className="text-[14px] font-semibold text-[#1d2a3f]">
                    {entry.day_label} · {entry.time_range}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6f819a]">
                    {entry.module_code} · {entry.task_label}
                  </p>
                </div>
              ))}
              {!(planning?.schedule || []).length ? (
                <p className="text-[14px] text-[#7486a1]">Aucune tache planifiee pour le moment.</p>
              ) : null}
            </div>
          </div>
        </div>
      </FormateurPanel>

      {planningAlerts.length ? (
        <FormateurPanel className="p-6">
          <FormateurSectionHeader
            title="Alertes automatiques"
            description="Le systeme surveille la charge hebdomadaire, les conflits, les periodes de stage et les examens."
          />
          <div className="mt-6 space-y-4">
            {planningAlerts.map((alert, index) => (
              <FormateurAlertCard key={`${alert.code || alert.message}-${index}`} alert={alert} />
            ))}
          </div>
        </FormateurPanel>
      ) : null}

      <FormateurPanel className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-[#1f2a3d]">
              Evaluation Questionnaire
            </h2>
            <p className="mt-2 text-[15px] text-[#7a8aa1]">
              {evaluation?.submitted
                ? `Votre score actuel est de ${Math.round(Number(evaluation?.percentage || 0))}% avec un calcul automatique base sur les reponses ponderees.`
                : 'Le questionnaire d evaluation n a pas encore ete soumis. Remplissez-le pour generer votre score.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${evaluationMeta.badgeClassName}`}>
              {evaluationMeta.helper}
            </span>
            <Link
              to="/formateur/questionnaire"
              className="inline-flex items-center rounded-[16px] bg-[linear-gradient(90deg,_#2155f5_0%,_#33b7ff_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(33,85,245,0.24)]"
            >
              Ouvrir le questionnaire
            </Link>
          </div>
        </div>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#edf1f7]">
          <div
            className={`h-full rounded-full ${evaluationMeta.progressClassName}`}
            style={{ width: `${Math.max(0, Math.min(100, evaluationMeta.progress))}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[13px] text-[#8c9bb0]">
          <span>0%</span>
          <span>{evaluationMeta.message}</span>
          <span>100%</span>
        </div>
      </FormateurPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <FormateurPanel className="p-6">
          <FormateurSectionHeader title="Mes Modules" />
          <div className="mt-6 space-y-4">
            {displayedModules.length ? (
              displayedModules.map((module) => <ModuleRow key={module.id} module={module} />)
            ) : (
              <FormateurEmptyBlock
                title="Aucun module assigne"
                description="Les modules affectes apparaitront ici des que le backend les remontera."
              />
            )}
          </div>
        </FormateurPanel>

        <FormateurPanel className="p-6">
          <FormateurSectionHeader title="Mes Groupes" />
          <div className="mt-6 space-y-4">
            {overview?.groups?.length ? (
              overview.groups.slice(0, 3).map((group) => <GroupRow key={group.id} group={group} />)
            ) : (
              <FormateurEmptyBlock
                title="Aucun groupe disponible"
                description="Les groupes derives des modules seront visibles ici."
              />
            )}
          </div>
        </FormateurPanel>
      </div>
    </div>
  );
}
