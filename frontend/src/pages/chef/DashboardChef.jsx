import React, { useEffect, useMemo, useState } from 'react';
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardService from '../../services/dashboardService';
import FormateurService from '../../services/formateurService';
import ModuleService from '../../services/moduleService';
import PlanningService from '../../services/planningService';
import AcademicConfigService from '../../services/academicConfigService';
import AffectationService from '../../services/affectationService';
import {
  buildDashboardKpis,
  buildFiliereSummaries,
  buildTrainerStatsMap,
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
import { cn } from '../../lib/cn';

function formatChartTick(value) {
  return `${Math.round(safeNumber(value))}h`;
}

function buildDistributionColor(ratio) {
  if (ratio >= 0.93) {
    return '#ff4d4f';
  }

  if (ratio >= 0.75) {
    return '#ffb000';
  }

  return '#2f5b89';
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
    <div className="rounded-[18px] border border-[#dfe7f2] bg-white px-4 py-3 shadow-[0_16px_34px_rgba(28,52,84,0.16)]">
      <p className="text-sm font-semibold text-[#203047]">{row.fullName}</p>
      <p className="mt-1 text-sm text-[#6f8199]">
        Heures attribuees: <span className="font-semibold text-[#203047]">{formatHours(row.assignedHours)}</span>
      </p>
      <p className="mt-1 text-sm text-[#6f8199]">
        Limite annuelle: <span className="font-semibold text-[#203047]">{formatHours(row.limit)}</span>
      </p>
    </div>
  );
}

function DistributionChart({ rows }) {
  if (!rows.length) {
    return (
      <ChefEmptyState
        title="Aucune charge a visualiser"
        description="Les barres de repartition apparaitront ici des que des affectations seront disponibles."
      />
    );
  }

  const maxValue = rows.reduce((maximum, row) => Math.max(maximum, row.assignedHours), 1);
  const domainMax = Math.max(1000, Math.ceil(maxValue / 250) * 250);
  const yTicks = Array.from(
    { length: Math.floor(domainMax / 250) + 1 },
    (_, index) => index * 250,
  );

  return (
    <div className="rounded-[24px] border border-[#e7eef8] bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] px-4 py-5">
      <div className="h-[305px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 12, right: 12, left: 0, bottom: 6 }}
            barCategoryGap={14}
          >
            <CartesianGrid stroke="#e9eef6" strokeDasharray="3 3" vertical />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={{ stroke: '#b7c4d6' }}
              tick={{ fill: '#8a99ad', fontSize: 11 }}
            />
            <YAxis
              domain={[0, domainMax]}
              ticks={yTicks}
              tickLine={false}
              axisLine={{ stroke: '#b7c4d6' }}
              tick={{ fill: '#8a99ad', fontSize: 11 }}
              tickFormatter={formatChartTick}
              width={44}
            />
            <Tooltip
              cursor={{ fill: 'rgba(47, 91, 137, 0.06)' }}
              content={<DistributionTooltip />}
            />
            <Bar
              dataKey="assignedHours"
              radius={[8, 8, 0, 0]}
              maxBarSize={56}
            >
              {rows.map((row) => (
                <Cell key={row.id} fill={row.barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardChef() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [formateurs, setFormateurs] = useState([]);
  const [modules, setModules] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [planningEntries, setPlanningEntries] = useState([]);
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
          formateursResponse,
          modulesResponse,
          affectationsResponse,
          planningResponse,
          academicConfigResponse,
        ] = await Promise.all([
          DashboardService.getStats(),
          FormateurService.list(),
          ModuleService.list(),
          AffectationService.list(),
          PlanningService.getWeeklyPlanning(),
          AcademicConfigService.getConfig(),
        ]);

        if (!mounted) {
          return;
        }

        setDashboardPayload(dashboardResponse || {});
        setFormateurs(Array.isArray(formateursResponse) ? formateursResponse : []);
        setModules(Array.isArray(modulesResponse) ? modulesResponse : []);
        setAffectations(Array.isArray(affectationsResponse) ? affectationsResponse : []);
        setPlanningEntries(Array.isArray(planningResponse) ? planningResponse : []);
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

  const trainerStatsMap = useMemo(
    () =>
      buildTrainerStatsMap({
        formateurs,
        affectations,
        planningEntries,
        dashboardStats: dashboardPayload?.formateurs || [],
        academicYear: academicConfig?.academic_year_label
          ? safeNumber(String(academicConfig.academic_year_label).slice(0, 4))
          : null,
        currentWeek,
      }),
    [academicConfig, affectations, dashboardPayload, formateurs, planningEntries, currentWeek],
  );

  const dashboardKpis = useMemo(
    () =>
      buildDashboardKpis({
        formateurs,
        modules,
        planningEntries,
        dashboardPayload,
      }),
    [dashboardPayload, formateurs, modules, planningEntries],
  );

  const distributionRows = useMemo(() => {
    return formateurs
      .map((formateur) => {
        const stats = trainerStatsMap[safeNumber(formateur.id)] || {};
        const assignedHours = safeNumber(stats.annual_hours);
        const loadRatio =
          safeNumber(formateur.max_heures) > 0
            ? assignedHours / safeNumber(formateur.max_heures)
            : 0;

        return {
          id: safeNumber(formateur.id),
          fullName: formateur.nom || 'Formateur',
          shortName: String(formateur.nom || '')
            .split(' ')
            .slice(-1)[0]
            ?.toUpperCase(),
          assignedHours,
          limit: safeNumber(formateur.max_heures),
          loadRatio,
          barColor: buildDistributionColor(loadRatio),
        };
      })
      .sort((left, right) => right.assignedHours - left.assignedHours)
      .slice(0, 8);
  }, [formateurs, trainerStatsMap]);

  const weeklyRows = useMemo(() => {
    return formateurs
      .map((formateur) => {
        const stats = trainerStatsMap[safeNumber(formateur.id)] || {};
        return {
          id: safeNumber(formateur.id),
          nom: formateur.nom,
          annualHours: safeNumber(stats.annual_hours),
          annualLimit: safeNumber(formateur.max_heures),
          currentWeekHours: safeNumber(stats.current_week_hours),
          maxWeekHours: safeNumber(stats.max_week_hours),
        };
      })
      .sort((left, right) => right.annualHours - left.annualHours)
      .slice(0, 5);
  }, [formateurs, trainerStatsMap]);

  const filiereSummaries = useMemo(
    () => buildFiliereSummaries(modules).slice(0, 4),
    [modules],
  );

  const currentWeekTotal = useMemo(() => {
    if (currentWeek === null) {
      return 0;
    }

    return planningEntries
      .filter((entry) => safeNumber(entry.semaine) === currentWeek)
      .reduce((sum, entry) => sum + safeNumber(entry.heures), 0);
  }, [planningEntries, currentWeek]);

  if (loading) {
    return <ChefLoadingState label="Chargement du dashboard Chef..." />;
  }

  return (
    <div className="space-y-6">
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
          key={`${alert.type}-${alert.formateur_id || index}`}
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
          value={formatHours(dashboardKpis.averageLoad)}
          helper="Moyenne annuelle par formateur"
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
          helper={currentWeek ? `Projection semaine ${currentWeek}` : 'Planning global'}
          icon={CalendarDays}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ChefSection
          title="Repartition des heures par formateur"
          subtitle="Histogramme dynamique des heures cumulees attribuees a chaque formateur, avec couleurs automatiques selon la charge reelle du projet."
        >
          <DistributionChart rows={distributionRows} />
        </ChefSection>

        <ChefSection
          title="Charge de travail hebdomadaire"
          subtitle="Vue consolidee des charges actuelles et maximales observees dans le planning."
        >
          {weeklyRows.length ? (
            <div className="space-y-5">
              {weeklyRows.map((row) => {
                const annualTone = getLoadTone(
                  row.annualLimit > 0 ? row.annualHours / row.annualLimit : 0,
                );

                return (
                  <div key={row.id} className="rounded-[20px] border border-[#e8eef7] bg-[#fbfdff] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[#1b2941]">{row.nom}</p>
                        <p className="text-sm text-[#7b8ea8]">
                          Actuel {formatHours(row.currentWeekHours)} · Max {formatHours(row.maxWeekHours)}
                        </p>
                      </div>
                      <ChefBadge tone={annualTone === 'danger' ? 'red' : annualTone === 'warning' ? 'orange' : 'green'}>
                        {formatHours(row.annualHours)} / {formatHours(row.annualLimit)}
                      </ChefBadge>
                    </div>
                    <ChefProgress
                      value={row.annualHours}
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
                        row.annualLimit > 0 ? (row.annualHours / row.annualLimit) * 100 : 0,
                      )}%`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <ChefEmptyState
              title="Aucun indicateur hebdomadaire"
              description="Les progressions hebdomadaires apparaissent ici des que du planning est saisi."
            />
          )}
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
                  className="rounded-[24px] border border-[#dce6f3] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(41,77,132,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn('inline-flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-bold text-white', summary.badge)}>
                      {summary.shortLabel}
                    </div>
                    <ChefBadge tone="slate">{summary.moduleCount} modules</ChefBadge>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[#1b2941]">{summary.filiere}</h3>
                  <p className="mt-2 text-sm text-[#7b8ea8]">
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
                  key={`${alert.type}-${alert.formateur_id || index}`}
                  className="rounded-[20px] border border-[#e8eef7] bg-[#fbfdff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#1b2941]">{alert.message}</p>
                      <p className="mt-1 text-sm text-[#7b8ea8]">
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
    </div>
  );
}
