import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardService from '../../services/dashboardService';
import { PremiumCard, PremiumMetricCard } from '../../components/ui/PremiumCard';
import { SkeletonChartPanel, SkeletonPremiumCard } from '../../components/ui/Skeleton';
import useAcademicConfig from '../../hooks/useAcademicConfig';

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function TrainerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-white/15" />
          <div className="h-10 w-1/2 rounded-2xl bg-slate-100 dark:bg-white/10" />
          <div className="h-5 w-2/5 rounded-2xl bg-slate-100 dark:bg-white/10" />
        </div>
      </PremiumCard>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonPremiumCard key={index} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <SkeletonChartPanel className="xl:col-span-7" />
        <SkeletonChartPanel className="xl:col-span-5" />
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <SkeletonChartPanel className="xl:col-span-5" />
        <SkeletonChartPanel className="xl:col-span-7" />
      </div>
    </div>
  );
}

export default function DashboardFormateur() {
  const {
    config,
    loading: academicLoading,
    academicYearLabel,
    currentWeek,
    currentSemester,
    inStagePeriod,
    inExamPeriod,
  } = useAcademicConfig();
  const [week, setWeek] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (week === null && !academicLoading) {
      setWeek(Math.max(1, Number(currentWeek || 1)));
    }
  }, [academicLoading, currentWeek, week]);

  useEffect(() => {
    if (week === null) {
      return undefined;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await DashboardService.getTrainerOverview(week);
        if (active) {
          setOverview(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || 'Impossible de charger le tableau de bord formateur.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [week]);

  const dailyTotals = Array.isArray(overview?.planning?.daily_totals) ? overview.planning.daily_totals : [];
  const displayedModules = Array.isArray(overview?.modules) ? overview.modules.slice(0, 5) : [];
  const displayedGroups = Array.isArray(overview?.groups) ? overview.groups.slice(0, 5) : [];
  const alerts = Array.isArray(overview?.alerts) ? overview.alerts.slice(0, 4) : [];
  const progressPercent = Math.max(0, Math.min(100, Number(overview?.progress?.percent || 0)));
  const maxWeek = useMemo(() => {
    if (!config?.end_date || !config?.start_date) {
      return 52;
    }

    const start = new Date(`${config.start_date}T00:00:00`);
    const end = new Date(`${config.end_date}T00:00:00`);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    return Math.max(1, Math.ceil(totalDays / 7));
  }, [config]);

  if (loading || week === null) {
    return <TrainerDashboardSkeleton />;
  }

  if (error) {
    return (
      <PremiumCard className="border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-6 text-[var(--color-danger-text)]" hover={false}>
        <h1 className="text-xl font-bold tracking-tight">Tableau de bord indisponible</h1>
        <p className="mt-2 text-sm leading-7">{error}</p>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-cyan-100">
              Vue formateur
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Bonjour {overview?.profile?.nom || 'Formateur'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
                Suivez votre progression, vos alertes de charge et vos seances sans surcharger l interface.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{academicYearLabel || 'Annee non definie'}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">Semaine {week}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{currentSemester || '-'}</span>
              {inStagePeriod ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">Stage</span> : null}
              {inExamPeriod ? <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-100">Exam</span> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWeek((current) => Math.max(1, Number(current || 1) - 1))}
                disabled={week <= 1}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-[132px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white">
                Semaine {week}
              </div>
              <button
                type="button"
                onClick={() => setWeek((current) => Math.min(maxWeek, Number(current || 1) + 1))}
                disabled={week >= maxWeek}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Link
                to="/formateur/planning"
                className="hover-action inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:brightness-105 dark:shadow-none"
              >
                Ouvrir mon planning
              </Link>
              <Link
                to="/formateur/modules"
                className="hover-action inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
              >
                Mes modules
              </Link>
            </div>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard
          icon={Clock3}
          label="Charge semaine"
          value={formatHourValue(overview?.stats?.weekly_hours)}
          meta={`Cible ${formatHourValue(overview?.stats?.weekly_target_hours)} / limite ${formatHourValue(overview?.stats?.weekly_limit_hours)}`}
          tone="brand"
        />
        <PremiumMetricCard
          icon={BookOpen}
          label="Modules actifs"
          value={overview?.stats?.assigned_modules ?? 0}
          meta={`${overview?.stats?.planning_entries ?? 0} seances planifiees`}
          tone="default"
        />
        <PremiumMetricCard
          icon={Users}
          label="Groupes suivis"
          value={overview?.stats?.groups_count ?? 0}
          meta={`${overview?.stats?.average_progress ?? 0}% progression moyenne`}
          tone="amber"
        />
        <PremiumMetricCard
          icon={Bell}
          label="Alertes et demandes"
          value={(overview?.stats?.pending_requests ?? 0) + (overview?.stats?.planning_alerts ?? 0)}
          meta={`${overview?.stats?.pending_requests ?? 0} demandes en attente`}
          tone="rose"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <PremiumCard className="xl:col-span-7" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Progression annuelle</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white">
                {formatHourValue(overview?.progress?.value)} sur {formatHourValue(overview?.progress?.target)}
              </h2>
            </div>
            <div className="rounded-2xl bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-700 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
              {progressPercent}%
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl bg-blue-50 p-5 transition-colors duration-300 dark:bg-blue-500/10">
            <div className="h-4 rounded-full bg-slate-200 transition-colors duration-300 dark:bg-white/10">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
              <span>Objectif annuel</span>
              <span>{overview?.progress?.is_above_target ? 'Au-dessus de l objectif' : 'Trajectoire en cours'}</span>
            </div>
          </div>

          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTotals}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-chart-tooltip-bg)',
                    border: '1px solid var(--color-chart-tooltip-border)',
                    borderRadius: '18px',
                    color: 'var(--color-chart-tooltip-text)',
                  }}
                />
                <Bar dataKey="hours" radius={[10, 10, 0, 0]} fill="var(--color-chart-line)" name="Heures" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>

        <PremiumCard className="xl:col-span-5" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Signal de vigilance</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Alertes prioritaires</h2>
            </div>
            <AlertTriangle className="h-6 w-6 text-[var(--color-warning-text)]" />
          </div>

          <div className="mt-6 space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
                Aucune alerte critique sur cette semaine.
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={`${alert.code || alert.message}-${index}`}
                  className="hover-card rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-soft)]">{alert.message}</p>
                      {alert.details ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{alert.details}</p> : null}
                    </div>
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      {alert.type || 'info'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </PremiumCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <PremiumCard className="xl:col-span-5" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Modules prioritaires</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Portefeuille pedagogique</h2>
            </div>
            <GraduationCap className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <div className="mt-6 space-y-3">
            {displayedModules.map((module) => (
              <div key={module.id} className="hover-card rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-soft)]">{module.code} · {module.intitule}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{module.filiere} · {module.semestre}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm font-bold text-[var(--color-primary)]">
                    {module.progress_percent ?? 0}%
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700"
                    style={{ width: `${Math.max(0, Math.min(100, Number(module.progress_percent || 0)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="xl:col-span-7" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Couverture de semaine</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Groupes, evaluation et prochaines actions</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Evaluation</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-soft)]">
                {overview?.evaluation?.percentage !== null ? `${Math.round(overview?.evaluation?.percentage || 0)}%` : '--'}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {overview?.evaluation?.submitted ? 'Questionnaire complete' : 'Aucune evaluation soumise'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Plage de semaine</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">
                {overview?.planning?.week_range?.label || 'Calendrier indisponible'}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {overview?.planning?.periods?.semester || currentSemester || '-'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Groupes suivis</p>
              <div className="mt-3 space-y-3">
                {displayedGroups.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Aucun groupe rattache pour cette periode.</p>
                ) : (
                  displayedGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--color-text-soft)]">{group.code}</span>
                      <span className="text-[var(--color-text-muted)]">{group.student_count} etudiants</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Raccourcis</p>
              <div className="mt-3 grid gap-3">
                <Link to="/formateur/planning" className="hover-action inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 px-4 text-sm font-semibold text-white shadow-sm dark:shadow-none">
                  Ouvrir la semaine detaillee
                </Link>
                <Link to="/formateur/demande" className="hover-action inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 text-sm font-semibold text-[var(--color-text-soft)]">
                  Gerer mes demandes
                </Link>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
