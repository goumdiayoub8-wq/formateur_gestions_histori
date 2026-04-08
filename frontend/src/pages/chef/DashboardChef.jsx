import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardService from '../../services/dashboardService';
import AcademicConfigService from '../../services/academicConfigService';
import {
  formatHours,
  getAcademicWeekNumber,
  getAlertTone,
  getLoadTone,
  safeNumber,
} from '../../utils/chefDashboard';
import {
  ChefAlertBanner,
  ChefBadge,
  ChefEmptyState,
  ChefLoadingState,
  ChefPageHero,
  ChefProgress,
  ChefSection,
  ChefStatCard,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';
import { PageTransition } from '../../components/ui/PageTransition';
import { Avatar } from '../../components/ui/Avatar';
import { cn } from '../../lib/cn';

function formatChartTick(value) {
  return `${Math.round(safeNumber(value))}h`;
}

function formatPercent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function buildDistributionColor(ratio) {
  if (ratio >= 0.93) {
    return 'var(--color-chart-bar-danger)';
  }

  if (ratio >= 0.75) {
    return 'var(--color-chart-bar-warning)';
  }

  return 'var(--color-chart-bar-safe)';
}

function buildListKey(prefix, value, index, extra = '') {
  const normalizedValue = String(value ?? '').trim();
  const normalizedExtra = String(extra ?? '').trim();

  return [prefix, normalizedValue || 'item', normalizedExtra || 'entry', index].join('-');
}

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className="theme-chart-tooltip rounded-[18px] border px-4 py-3">
      <p className="text-sm font-semibold text-[var(--color-chart-tooltip-text)]">{row.fullName}</p>
      <p className="mt-1 text-sm text-[var(--color-chart-tooltip-muted)]">
        Heures validees: <span className="font-semibold text-[var(--color-chart-tooltip-text)]">{formatHours(row.plannedHours)}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--color-chart-tooltip-muted)]">
        Heures realisees: <span className="font-semibold text-[var(--color-chart-tooltip-text)]">{formatHours(row.completedHours)}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--color-chart-tooltip-muted)]">
        Limite annuelle: <span className="font-semibold text-[var(--color-chart-tooltip-text)]">{formatHours(row.limit)}</span>
      </p>
    </div>
  );
}

function MeasuredChart({ height, minHeight = 220, children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const syncSize = (width, nextHeight) => {
      const normalizedWidth = Math.max(0, Math.round(width || 0));
      const normalizedHeight = Math.max(minHeight, Math.round(nextHeight || 0));

      setSize((current) => {
        if (current.width === normalizedWidth && current.height === normalizedHeight) {
          return current;
        }

        return {
          width: normalizedWidth,
          height: normalizedHeight,
        };
      });
    };

    syncSize(node.clientWidth, node.clientHeight || height || minHeight);

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      syncSize(entry.contentRect.width, entry.contentRect.height || node.clientHeight || height || minHeight);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [height, minHeight]);

  return (
    <div ref={containerRef} className="min-w-0 w-full" style={{ height }}>
      {size.width > 0 ? children(size) : null}
    </div>
  );
}

function DistributionChart({ rows }) {
  if (!rows.length) {
    return (
      <ChefEmptyState
        title="Aucune charge a visualiser"
        description="Les barres de repartition apparaitront ici des que du planning valide sera disponible."
      />
    );
  }

  const maxValue = rows.reduce((maximum, row) => Math.max(maximum, row.plannedHours), 1);
  const domainMax = Math.max(1000, Math.ceil(maxValue / 250) * 250);
  const yTicks = Array.from(
    { length: Math.floor(domainMax / 250) + 1 },
    (_, index) => index * 250,
  );

  return (
    <div className="theme-card rounded-[24px] border px-4 py-5">
      <MeasuredChart height={305} minHeight={305}>
        {({ width, height }) => (
          <BarChart
            width={width}
            height={height}
            data={rows}
            margin={{ top: 12, right: 12, left: 0, bottom: 6 }}
            barCategoryGap={14}
          >
            <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
            />
            <YAxis
              domain={[0, domainMax]}
              ticks={yTicks}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-chart-axis)' }}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
              tickFormatter={formatChartTick}
              width={44}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-chart-cursor)' }}
              content={<DistributionTooltip />}
            />
            <Bar
              dataKey="plannedHours"
              radius={[8, 8, 0, 0]}
              maxBarSize={56}
            >
              {rows.map((row, index) => (
                <Cell key={buildListKey('distribution-cell', row.id, index, row.fullName)} fill={row.barColor} />
              ))}
            </Bar>
          </BarChart>
        )}
      </MeasuredChart>
    </div>
  );
}

export default function DashboardChef() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(null);
  const { toasts, pushToast, dismissToast } = useChefToasts();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          dashboardResponse,
          academicConfigResponse,
        ] = await Promise.all([
          DashboardService.getStats(),
          AcademicConfigService.getConfig(),
        ]);

        if (!mounted) {
          return;
        }

        setDashboardPayload(dashboardResponse || {});
        setAcademicConfig(academicConfigResponse || null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        const message = loadError.message || 'Impossible de charger le dashboard Chef.';
        setError(message);
        pushToast({
          tone: 'danger',
          title: 'Chargement impossible',
          description: message,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const currentWeek = useMemo(
    () => getAcademicWeekNumber(academicConfig),
    [academicConfig],
  );

  const dashboardTrainerRows = useMemo(
    () => (Array.isArray(dashboardPayload?.formateurs) ? dashboardPayload.formateurs : []),
    [dashboardPayload],
  );

  const dashboardKpis = useMemo(
    () => ({
      totalFormateurs: safeNumber(dashboardPayload?.overview?.total_formateurs, 0),
      totalModules: safeNumber(dashboardPayload?.overview?.total_modules, 0),
      averageCompletedLoad:
        dashboardTrainerRows.length > 0
          ? Math.round(
              dashboardTrainerRows.reduce((sum, row) => sum + safeNumber(row.completed_hours), 0)
                / dashboardTrainerRows.length,
            )
          : 0,
      averagePlannedLoad:
        dashboardTrainerRows.length > 0
          ? Math.round(
              dashboardTrainerRows.reduce((sum, row) => sum + safeNumber(row.planned_hours), 0)
                / dashboardTrainerRows.length,
            )
          : 0,
      alertCount: Array.isArray(dashboardPayload?.alerts) ? dashboardPayload.alerts.length : 0,
    }),
    [dashboardPayload, dashboardTrainerRows],
  );

  const distributionRows = useMemo(() => {
    return dashboardTrainerRows
      .map((formateur) => {
        const plannedHours = safeNumber(formateur.planned_hours);
        const completedHours = safeNumber(formateur.completed_hours);
        const loadRatio =
          safeNumber(formateur.max_heures) > 0
            ? plannedHours / safeNumber(formateur.max_heures)
            : 0;

        return {
          id: safeNumber(formateur.id),
          fullName: formateur.nom || 'Formateur',
          shortName: String(formateur.nom || '')
            .split(' ')
            .slice(-1)[0]
            ?.toUpperCase(),
          rowKey: buildListKey('distribution-row', formateur.id, 0, formateur.email || formateur.nom),
          plannedHours,
          completedHours,
          limit: safeNumber(formateur.max_heures),
          loadRatio,
          barColor: buildDistributionColor(loadRatio),
        };
      })
      .sort((left, right) => right.plannedHours - left.plannedHours)
      .slice(0, 8);
  }, [dashboardTrainerRows]);

  const weeklyRows = useMemo(() => {
    return dashboardTrainerRows
      .map((formateur) => {
        return {
          id: safeNumber(formateur.id || formateur.formateur_id),
          nom: formateur.nom,
          completedHours: safeNumber(formateur.completed_hours),
          plannedHours: safeNumber(formateur.planned_hours),
          annualLimit: safeNumber(formateur.max_heures),
          currentWeekHours: safeNumber(formateur.current_week_hours),
          maxWeekHours: safeNumber(formateur.max_week_hours),
        };
      })
      .sort((left, right) => {
        if (right.currentWeekHours !== left.currentWeekHours) {
          return right.currentWeekHours - left.currentWeekHours;
        }

        return right.completedHours - left.completedHours;
      })
      .slice(0, 5);
  }, [dashboardTrainerRows]);

  const filiereSummaries = useMemo(() => {
    const colorSets = [
      { badge: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-300' },
      { badge: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300' },
      { badge: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
      { badge: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300' },
    ];

    return (Array.isArray(dashboardPayload?.hours_by_filiere) ? dashboardPayload.hours_by_filiere : [])
      .slice(0, 4)
      .map((row, index) => ({
        id: row.filiere || `filiere-${index}`,
        filiere: row.filiere || 'Sans filiere',
        moduleCount: safeNumber(row.module_count, 0),
        totalHours: safeNumber(row.total_module_hours, row.total_hours),
        efmCount: safeNumber(row.efm_count, 0),
        shortLabel: String(row.filiere || 'SF')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((chunk) => chunk[0]?.toUpperCase() || '')
          .join(''),
        ...colorSets[index % colorSets.length],
      }));
  }, [dashboardPayload]);

  const currentWeekTotal = useMemo(() => {
    const overviewValue = safeNumber(dashboardPayload?.overview?.current_week_validated_hours, NaN);
    if (Number.isFinite(overviewValue)) {
      return overviewValue;
    }

    return dashboardTrainerRows.reduce((sum, row) => sum + safeNumber(row.current_week_hours), 0);
  }, [dashboardPayload, dashboardTrainerRows]);

  const modulePerformanceRows = useMemo(
    () => (Array.isArray(dashboardPayload?.module_performance) ? dashboardPayload.module_performance : []),
    [dashboardPayload],
  );

  const moduleCompletionRows = useMemo(
    () => (Array.isArray(dashboardPayload?.module_completion) ? dashboardPayload.module_completion : []),
    [dashboardPayload],
  );

  const weeklyLoadTimeline = useMemo(
    () => (Array.isArray(dashboardPayload?.teaching_load?.weekly) ? dashboardPayload.teaching_load.weekly : []),
    [dashboardPayload],
  );

  const monthlyLoadTimeline = useMemo(
    () => (Array.isArray(dashboardPayload?.teaching_load?.monthly) ? dashboardPayload.teaching_load.monthly : []),
    [dashboardPayload],
  );

  const questionnaireAnalytics = dashboardPayload?.questionnaire_analytics || null;

  if (loading) {
    return <ChefLoadingState label="Chargement du dashboard Chef..." />;
  }

  return (
    <PageTransition className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefPageHero
        icon={LayoutDashboard}
        title="Bienvenue sur le tableau de bord"
        subtitle="Gestion complete du pole: formateurs, modules, affectations, charge hebdomadaire et alertes metier en un seul espace."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ChefBadge tone="blue">
              {academicConfig?.academic_year_label || 'Annee en cours'}
            </ChefBadge>
            {currentWeek ? <ChefBadge tone="violet">Semaine {currentWeek}</ChefBadge> : null}
          </div>
        }
      />

      {error ? (
        <ChefAlertBanner
          tone="danger"
          title="Erreur de chargement"
          description={error}
        />
      ) : null}

      {(dashboardPayload?.alerts || []).slice(0, 2).map((alert, index) => (
        <ChefAlertBanner
          key={buildListKey('chef-alert-top', alert.formateur_id || alert.type, index, alert.message)}
          tone={getAlertTone(alert.type)}
          title={alert.type === 'annual_limit_exceeded' ? 'Charge annuelle critique' : alert.type === 'weekly_overload' ? 'Surcharge hebdomadaire' : 'Alerte metier'}
          description={alert.message}
        />
      ))}

      <div className="grid gap-4 xl:grid-cols-5">
        <ChefStatCard
          label="Formateurs"
          value={dashboardKpis.totalFormateurs}
          helper="Population active"
          icon={Users}
          tone="blue"
        />
        <ChefStatCard
          label="Modules"
          value={dashboardKpis.totalModules}
          helper="Catalogue pedagogique"
          icon={BookOpen}
          tone="orange"
        />
        <ChefStatCard
          label="Charge moyenne"
          value={formatHours(dashboardKpis.averageCompletedLoad)}
          helper={`Realise · Valide moyen ${formatHours(dashboardKpis.averagePlannedLoad)}`}
          icon={Sparkles}
          tone="green"
        />
        <ChefStatCard
          label="Alertes actives"
          value={dashboardKpis.alertCount}
          helper="Depassements et desequilibres"
          icon={AlertTriangle}
          tone="red"
        />
        <ChefStatCard
          label="Heures / semaine"
          value={formatHours(currentWeekTotal)}
          helper={currentWeek ? `Validees semaine ${currentWeek}` : 'Planning valide'}
          icon={CalendarDays}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ChefSection
          title="Repartition des heures par formateur"
          subtitle="Histogramme des heures planifiees validees par formateur, sans melanger affectations et seances realisees."
        >
          <DistributionChart rows={distributionRows} />
        </ChefSection>

        <ChefSection
          title="Charge de travail hebdomadaire"
          subtitle="Charges hebdomadaires calculees uniquement sur le planning valide, avec progression annuelle basee sur les seances realisees."
        >
          {weeklyRows.length ? (
            <div className="space-y-5">
              {weeklyRows.map((row, index) => {
                const annualTone = getLoadTone(
                  row.annualLimit > 0 ? row.completedHours / row.annualLimit : 0,
                );

                return (
                  <div key={buildListKey('weekly-row', row.id, index, row.nom)} className="hover-card theme-card-muted rounded-[20px] border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.nom} size={42} />
                        <div>
                          <p className="text-lg font-semibold text-slate-900 transition-colors duration-300 dark:text-white">{row.nom}</p>
                          <p className="text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                            Valide {formatHours(row.currentWeekHours)} · Max {formatHours(row.maxWeekHours)} · Realise {formatHours(row.completedHours)}
                          </p>
                        </div>
                      </div>
                      <ChefBadge tone={annualTone === 'danger' ? 'red' : annualTone === 'warning' ? 'orange' : 'green'}>
                        Realise {formatHours(row.completedHours)} / {formatHours(row.annualLimit)}
                      </ChefBadge>
                    </div>
                    <ChefProgress
                      value={row.completedHours}
                      max={row.annualLimit}
                      tone={
                        annualTone === 'danger'
                          ? 'red'
                          : annualTone === 'warning'
                            ? 'orange'
                            : annualTone === 'info'
                              ? 'violet'
                              : 'blue'
                      }
                      rightLabel={`${Math.round(
                        row.annualLimit > 0 ? (row.completedHours / row.annualLimit) * 100 : 0,
                      )}%`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <ChefEmptyState
              title="Aucun indicateur hebdomadaire"
              description="Les progressions hebdomadaires apparaissent ici des que du planning valide est disponible."
            />
          )}
        </ChefSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChefSection
          title="Performance formateurs par module"
          subtitle="Vue croisee utile pour arbitrer les modules les plus avances, les heures realisees et le niveau des evaluations."
        >
          {modulePerformanceRows.length ? (
            <div className="space-y-4">
              {modulePerformanceRows.map((row) => (
                <div
                  key={`${row.module_id}-${row.formateur_id}`}
                  className="hover-card theme-card-muted rounded-[20px] border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
                        {row.code} · {row.intitule}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                        <Avatar name={row.formateur_nom} size={24} />
                        <span>{row.formateur_nom} · {row.filiere}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ChefBadge tone="blue">{formatPercent(row.completion_percent)} progression</ChefBadge>
                      <ChefBadge tone={row.questionnaire_percentage !== null ? 'green' : 'slate'}>
                        {row.questionnaire_percentage !== null
                          ? `${formatPercent(row.questionnaire_percentage)} questionnaire`
                          : 'Questionnaire en attente'}
                      </ChefBadge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ChefProgress
                      value={row.completed_hours}
                      max={row.volume_horaire}
                      tone="blue"
                      label="Execution module"
                      rightLabel={`${formatHours(row.completed_hours)} / ${formatHours(row.volume_horaire)}`}
                    />
                    <ChefProgress
                      value={row.questionnaire_percentage ?? 0}
                      max={100}
                      tone={row.questionnaire_percentage !== null && row.questionnaire_percentage >= 75 ? 'green' : 'orange'}
                      label="Evaluation questionnaire"
                      rightLabel={row.questionnaire_percentage !== null ? formatPercent(row.questionnaire_percentage) : 'Non repondu'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ChefEmptyState
              title="Aucune performance module disponible"
              description="Les indicateurs apparaitront ici des que des heures realisees et des questionnaires seront disponibles."
            />
          )}
        </ChefSection>

        <ChefSection
          title="Suivi charge et evaluations"
          subtitle="Lecture rapide de la charge recente et du taux de completion des questionnaires du pole."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="hover-card theme-card-muted rounded-[20px] border p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Questionnaires</p>
              <div className="mt-4 grid gap-4">
                <div>
                  <p className="text-[28px] font-bold text-slate-900 transition-colors duration-300 dark:text-white">
                    {questionnaireAnalytics?.completion_rate ?? 0}%
                  </p>
                  <p className="text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">Taux de reponse sur les questionnaires affectes</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold text-slate-900 transition-colors duration-300 dark:text-white">
                    {questionnaireAnalytics?.average_percentage ?? 0}%
                  </p>
                  <p className="text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">Score moyen des evaluations remplies</p>
                </div>
                <ChefProgress
                  value={questionnaireAnalytics?.completed_questionnaires ?? 0}
                  max={questionnaireAnalytics?.assigned_questionnaires ?? 0}
                  tone="green"
                  label="Couverture"
                  rightLabel={`${questionnaireAnalytics?.completed_questionnaires ?? 0} / ${questionnaireAnalytics?.assigned_questionnaires ?? 0}`}
                />
              </div>
            </div>

            <div className="hover-card theme-card-muted rounded-[20px] border p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Charge recente</p>
              <MeasuredChart height={220} minHeight={220}>
                {({ width, height }) => (
                  <LineChart width={width} height={height} data={weeklyLoadTimeline}>
                    <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
                      tickFormatter={formatChartTick}
                      width={40}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="var(--color-chart-line)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--color-chart-line)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </MeasuredChart>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="hover-card theme-card-muted rounded-[20px] border p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Charge mensuelle</p>
              <div className="mt-4 space-y-3">
                {monthlyLoadTimeline.length ? (
                  monthlyLoadTimeline.map((row) => (
                    <ChefProgress
                      key={row.month_key}
                      value={row.hours}
                      max={Math.max(...monthlyLoadTimeline.map((entry) => entry.hours), 1)}
                      tone="violet"
                      label={row.label}
                      rightLabel={formatHours(row.hours)}
                    />
                  ))
                ) : (
                  <ChefEmptyState
                    title="Aucune charge mensuelle"
                    description="Les heures realisees mensuelles seront visibles ici."
                  />
                )}
              </div>
            </div>

            <div className="hover-card theme-card-muted rounded-[20px] border p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors duration-300 dark:text-slate-400">Modules les plus avances</p>
              <div className="mt-4 space-y-4">
                {moduleCompletionRows.length ? (
                  moduleCompletionRows.map((row) => (
                    <div key={row.id} className="theme-card rounded-[18px] border px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
                            {row.code} · {row.intitule}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                            <Avatar name={row.formateur_nom} size={20} />
                            <span>{row.formateur_nom}</span>
                          </div>
                        </div>
                        <ChefBadge tone={row.progress_percent >= 80 ? 'green' : row.progress_percent >= 50 ? 'orange' : 'red'}>
                          {formatPercent(row.progress_percent)}
                        </ChefBadge>
                      </div>
                      <div className="mt-3">
                        <ChefProgress
                          value={row.completed_hours}
                          max={row.volume_horaire}
                          tone="blue"
                          rightLabel={`${formatHours(row.completed_hours)} / ${formatHours(row.volume_horaire)}`}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <ChefEmptyState
                    title="Aucun module a suivre"
                    description="La completion des modules apparaitra ici apres execution du planning."
                  />
                )}
              </div>
            </div>
          </div>
        </ChefSection>

      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChefSection
          title="Filieres et capacite"
          subtitle="Le dashboard reprend la logique visuelle des maquettes avec des cartes filieres lisibles et un acces rapide aux volumes."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {filiereSummaries.length ? (
              filiereSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="theme-card rounded-[24px] border px-5 py-5 shadow-[0_14px_34px_var(--color-shadow)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn('inline-flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-bold text-white', summary.badge)}>
                      {summary.shortLabel}
                    </div>
                    <ChefBadge tone="slate">{summary.moduleCount} modules</ChefBadge>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900 transition-colors duration-300 dark:text-white">{summary.filiere}</h3>
                  <p className="mt-2 text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                    {formatHours(summary.totalHours)} au total · {summary.efmCount} module(s) EFM
                  </p>
                </div>
              ))
            ) : (
              <ChefEmptyState
                title="Aucune filiere disponible"
                description="Ajoutez des modules pour voir apparaitre la synthese des filieres."
              />
            )}
          </div>
        </ChefSection>

        <ChefSection
          title="Centre de vigilance"
          subtitle="Alertes metier directes du backend et indicateurs prioritaires a surveiller pendant les affectations."
        >
          {(dashboardPayload?.alerts || []).length ? (
            <div className="space-y-4">
              {(dashboardPayload?.alerts || []).slice(0, 6).map((alert, index) => (
                <div
                  key={buildListKey('chef-alert-center', alert.formateur_id || alert.type, index, alert.message)}
                  className="hover-card theme-card-muted rounded-[20px] border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white">{alert.message}</p>
                      <p className="mt-1 text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                        {alert.type === 'weekly_overload'
                          ? 'Revue planning recommandee'
                          : 'Action Chef de pole recommande'}
                      </p>
                    </div>
                    <ChefBadge tone={getAlertTone(alert.type) === 'danger' ? 'red' : 'orange'}>
                      {alert.type}
                    </ChefBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ChefEmptyState
              title="Aucune alerte critique"
              description="Le moteur de validation ne remonte actuellement aucun depassement annuel, hebdomadaire ou desequilibre majeur."
            />
          )}
        </ChefSection>
      </div>
    </PageTransition>
  );
}
