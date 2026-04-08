import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, Clock3, ShieldCheck, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardService from '../../services/dashboardService';
import { PremiumCard, PremiumMetricCard } from '../../components/ui/PremiumCard';
import { SkeletonChartPanel, SkeletonPremiumCard } from '../../components/ui/Skeleton';
import DirectorStatusPill from '../../components/director/DirectorStatusPill';
import useAcademicConfig from '../../hooks/useAcademicConfig';
import { Avatar } from '../../components/ui/Avatar';

const PIE_COLORS = ['var(--color-chart-line)', 'var(--color-warning-text)', 'var(--color-danger-text)'];

function formatRelativeDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / 3600000));

  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays}j`;
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function DirectorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="space-y-4">
          <div className="h-4 w-36 rounded-full bg-slate-200 dark:bg-white/15" />
          <div className="h-10 w-3/5 rounded-2xl bg-slate-100 dark:bg-white/10" />
          <div className="h-5 w-2/5 rounded-2xl bg-slate-100 dark:bg-white/10" />
        </div>
      </PremiumCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonPremiumCard key={index} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <SkeletonChartPanel className="xl:col-span-5" />
        <SkeletonChartPanel className="xl:col-span-7" />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <SkeletonChartPanel className="xl:col-span-4" />
        <SkeletonChartPanel className="xl:col-span-4" />
        <SkeletonChartPanel className="xl:col-span-4" />
      </div>
    </div>
  );
}

export default function DashboardDirecteur() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {
    config,
    loading: academicLoading,
    academicYearLabel,
    currentWeek,
    currentSemester,
    inStagePeriod,
    inExamPeriod,
  } = useAcademicConfig();

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await DashboardService.getDirectorOverview();
        if (active) {
          setOverview(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || 'Impossible de charger le tableau de bord directeur.');
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
  }, []);

  const pieData = useMemo(() => {
    if (!overview?.validation_status) {
      return [];
    }

    return [
      { name: 'Valides', value: Number(overview.validation_status.validated || 0) },
      { name: 'En attente', value: Number(overview.validation_status.pending || 0) },
      { name: 'Revision', value: Number(overview.validation_status.revision || 0) },
    ];
  }, [overview]);

  const hourSeries = Array.isArray(overview?.hours_by_filiere) ? overview.hours_by_filiere.slice(0, 6) : [];
  const ranking = Array.isArray(overview?.trainer_ranking) ? overview.trainer_ranking : [];
  const recentActivities = Array.isArray(overview?.recent_activities) ? overview.recent_activities.slice(0, 6) : [];
  const bestModules = Array.isArray(overview?.module_highlights?.best) ? overview.module_highlights.best : [];
  const worstModules = Array.isArray(overview?.module_highlights?.worst) ? overview.module_highlights.worst : [];

  if (loading) {
    return <DirectorDashboardSkeleton />;
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
    <div className="space-y-6">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
              Pilotage executif
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{overview?.hero?.title || 'Tableau de bord directeur'}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">{overview?.hero?.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{academicYearLabel || 'Annee non definie'}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">Semaine {currentWeek ?? '-'}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white">{currentSemester || '-'}</span>
              {inStagePeriod ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">Stage</span> : null}
              {inExamPeriod ? <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-100">Exam</span> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/directeur/validation-planning"
              className="hover-action inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:brightness-105 dark:shadow-none"
            >
              Ouvrir les validations
            </Link>
            <Link
              to="/directeur/academic-config"
              className="hover-action inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
            >
              Configurer le calendrier
            </Link>
          </div>
        </div>
      </PremiumCard>

      {!academicLoading && !config ? (
        <PremiumCard className="border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-5 text-[var(--color-warning-text)]" hover={false}>
          Configurez l annee scolaire pour fiabiliser les calculs de semaine, de semestre et de progression.
        </PremiumCard>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard
          icon={AlertTriangle}
          label="Validations en attente"
          value={overview?.kpis?.pending_validations ?? 0}
          meta="Soumissions a arbitrer"
          tone="amber"
          delay={0}
        />
        <PremiumMetricCard
          icon={ShieldCheck}
          label="Taux de validation"
          value={formatPercent(overview?.kpis?.validation_rate)}
          meta={`Cette semaine: ${overview?.kpis?.validation_rate_delta ?? 0}`}
          tone="brand"
          delay={0.05}
        />
        <PremiumMetricCard
          icon={BookOpen}
          label="Modules en cours"
          value={overview?.kpis?.modules_in_progress ?? 0}
          meta="Charge pedagogique active"
          tone="default"
          delay={0.1}
        />
        <PremiumMetricCard
          icon={Users2}
          label="Groupes actifs"
          value={overview?.kpis?.active_groups ?? 0}
          meta="Couverts cette periode"
          tone="rose"
          delay={0.15}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <PremiumCard className="xl:col-span-5" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Validation globale</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white">Etat du pipeline de validation</h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
              {pieData.reduce((sum, item) => sum + item.value, 0)} soumissions
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                    {pieData.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-chart-tooltip-bg)',
                      border: '1px solid var(--color-chart-tooltip-border)',
                      borderRadius: '18px',
                      color: 'var(--color-chart-tooltip-text)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {pieData.map((item, index) => (
                <div key={item.name} className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-sm font-semibold text-[var(--color-text-soft)]">{item.name}</span>
                    </div>
                    <span className="text-sm text-[var(--color-text-muted)]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="xl:col-span-7" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Charge par filiere</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Heures planifiees et executees</h2>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
              Vue agregee
            </div>
          </div>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourSeries} barGap={10}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="filiere" tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-chart-tooltip-bg)',
                    border: '1px solid var(--color-chart-tooltip-border)',
                    borderRadius: '18px',
                    color: 'var(--color-chart-tooltip-text)',
                  }}
                />
                <Bar dataKey="completed_hours" radius={[10, 10, 0, 0]} fill="var(--color-chart-line)" name="Realise" />
                <Bar dataKey="planned_hours" radius={[10, 10, 0, 0]} fill="var(--color-primary-strong)" name="Planifie" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <PremiumCard className="xl:col-span-4" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Top formateurs</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Classement de performance</h2>
            </div>
            <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <div className="mt-6 space-y-3">
            {ranking.map((row) => (
              <div key={row.id} className="hover-card rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.nom} size={40} />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-soft)]">{row.rank}. {row.nom}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{row.specialite || 'Specialite non definie'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm font-bold text-[var(--color-primary)]">
                    {row.score}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-subtle)]">
                  <span>{row.completed_hours}h realisees</span>
                  <span>{row.questionnaire_percentage ?? 0}% eval.</span>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="xl:col-span-4" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Modules a surveiller</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Best et worst performers</h2>
            </div>
            <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Top modules</p>
              <div className="mt-3 space-y-3">
                {bestModules.map((module) => (
                  <div key={`best-${module.id}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--color-text-soft)]">{module.intitule}</span>
                    <span className="rounded-full bg-emerald-500/14 px-3 py-1 text-emerald-200">{formatPercent(module.completion_rate)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">Modules critiques</p>
              <div className="mt-3 space-y-3">
                {worstModules.map((module) => (
                  <div key={`worst-${module.id}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--color-text-soft)]">{module.intitule}</span>
                    <span className="rounded-full bg-rose-500/14 px-3 py-1 text-rose-200">{formatPercent(module.completion_rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="xl:col-span-4" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Activite recente</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Signal faible et traces</h2>
            </div>
            <Clock3 className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <div className="mt-6 space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-soft)]">{activity.action_label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{activity.action_description}</p>
                  </div>
                  <DirectorStatusPill status={activity.action_tone === 'success' ? 'approved' : activity.action_tone === 'warning' ? 'revision' : 'pending'} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">{formatRelativeDate(activity.created_at)}</p>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard
          icon={CheckCircle2}
          label="Progression globale"
          value={formatPercent(overview?.global_performance?.completion_rate)}
          meta="Heures executees"
          tone="brand"
        />
        <PremiumMetricCard
          icon={Clock3}
          label="Couverture planning"
          value={formatPercent(overview?.global_performance?.planned_coverage_rate)}
          meta="Heures planifiees"
          tone="amber"
        />
        <PremiumMetricCard
          icon={Users2}
          label="Taux questionnaires"
          value={formatPercent(overview?.global_performance?.questionnaire_completion_rate)}
          meta="Modules avec retour"
          tone="default"
        />
        <PremiumMetricCard
          icon={BookOpen}
          label="Note moyenne"
          value={overview?.global_performance?.questionnaire_average !== null ? `${Math.round(overview?.global_performance?.questionnaire_average || 0)}%` : '--'}
          meta="Qualite pedagogique"
          tone="rose"
        />
      </div>
    </div>
  );
}
