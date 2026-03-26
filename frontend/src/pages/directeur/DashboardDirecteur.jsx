import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarRange, CheckCircle2, Settings2, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardService from '../../services/dashboardService';
import DirectorSurface from '../../components/director/DirectorSurface';
import DirectorStatCard from '../../components/director/DirectorStatCard';
import DirectorStatusPill from '../../components/director/DirectorStatusPill';
import useAcademicConfig from '../../hooks/useAcademicConfig';

function formatRelativeDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  const diffHours = Math.round((Date.now() - date.getTime()) / 3600000);
  if (diffHours <= 1) {
    return 'Il y a 1h';
  }

  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays}j`;
}

const pieColors = ['#1db885', '#f8a30b', '#f44747'];

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
    validation,
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
          setError(loadError.message || 'Impossible de charger le tableau de bord.');
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
      { name: 'Validés', value: overview.validation_status.validated },
      { name: 'En attente', value: overview.validation_status.pending },
      { name: 'À réviser', value: overview.validation_status.revision },
    ];
  }, [overview]);

  const validationLegendItems = useMemo(
    () =>
      pieData.map((item, index) => ({
        ...item,
        color: pieColors[index % pieColors.length],
      })),
    [pieData],
  );

  if (loading) {
    return <div className="rounded-[24px] border border-[#dfe6f3] bg-white px-6 py-16 text-center text-[#64748b]">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="rounded-[24px] border border-[#ffd9d9] bg-[#fff5f5] px-6 py-6 text-[#d14343]">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-[linear-gradient(90deg,_#4f35f2_0%,_#7a24f8_55%,_#a414ff_100%)] px-6 py-7 text-white">
        <h1 className="text-[28px] font-semibold tracking-tight">{overview?.hero?.title}</h1>
        <p className="mt-2 text-lg text-white/80">{overview?.hero?.subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">{academicYearLabel || 'Annee non definie'}</span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">Semaine {currentWeek ?? '-'}</span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">{currentSemester || '-'}</span>
          {inStagePeriod ? <span className="rounded-full bg-[#20c05c] px-3 py-1.5 font-semibold text-white">Stage</span> : null}
          {inExamPeriod ? <span className="rounded-full bg-[#ff9b1f] px-3 py-1.5 font-semibold text-white">Exam</span> : null}
        </div>
      </div>

      {!academicLoading && !config ? (
        <div className="rounded-[24px] border border-[#ffe4b3] bg-[#fff8ea] px-6 py-5 text-[#9a6500]">
          Configurez l&apos;annee scolaire pour activer les calculs de semaine et de semestre.
        </div>
      ) : null}

      {!academicLoading && config && !validation.isValid ? (
        <div className="rounded-[24px] border border-[#ffd9d9] bg-[#fff5f5] px-6 py-5 text-[#d14343]">
          La configuration academique est invalide. Corrigez-la dans la page de configuration.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-4">
        <DirectorStatCard
          icon={AlertTriangle}
          iconWrapperClassName="bg-[#fff4eb]"
          iconClassName="text-[#ff5a15]"
          label="Validations en attente"
          value={overview?.kpis?.pending_validations ?? 0}
          hint="En attente"
        />

        <DirectorStatCard
          icon={CheckCircle2}
          iconWrapperClassName="bg-[#eaf9ee]"
          iconClassName="text-[#19b44b]"
          label="Taux de Validation"
          value={`${overview?.kpis?.validation_rate ?? 0}%`}
          hint={`↗ +${overview?.kpis?.validation_rate_delta ?? 0}`}
        >
          <div className="h-2 w-[135px] overflow-hidden rounded-full bg-[#edf3ef]">
            <div
              className="h-full rounded-full bg-[#22c55e]"
              style={{ width: `${Math.max(0, Math.min(overview?.kpis?.validation_rate ?? 0, 100))}%` }}
            />
          </div>
        </DirectorStatCard>

        <DirectorStatCard
          icon={BookOpen}
          iconWrapperClassName="bg-[#eef3ff]"
          iconClassName="text-[#3567ff]"
          label="Modules en cours"
          value={overview?.kpis?.modules_in_progress ?? 0}
        />

        <DirectorStatCard
          icon={Users2}
          iconWrapperClassName="bg-[#f5eaff]"
          iconClassName="text-[#9d38ff]"
          label="Groupes actifs"
          value={overview?.kpis?.active_groups ?? 0}
        />
      </div>

      <DirectorSurface className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18243a]">Calendrier Académique</h2>
            <p className="mt-2 text-[15px] text-[#6b7a92]">
              Suivi dynamique de l&apos;annee scolaire pour les dashboards et calculs hebdomadaires.
            </p>
          </div>
          <Link
            to="/directeur/academic-config"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(90deg,_#4f35f2_0%,_#7a24f8_55%,_#d31391_100%)] px-4 text-[14px] font-semibold text-white"
          >
            <Settings2 className="h-4 w-4" />
            Configurer
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[18px] border border-[#e7edf6] bg-[#f9fbff] px-4 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#95a3b7]">Année</p>
            <p className="mt-3 text-[18px] font-semibold text-[#1f2a3d]">{academicYearLabel || '-'}</p>
          </div>
          <div className="rounded-[18px] border border-[#e7edf6] bg-[#f9fbff] px-4 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#95a3b7]">Début</p>
            <p className="mt-3 text-[18px] font-semibold text-[#1f2a3d]">{config?.start_date || '-'}</p>
          </div>
          <div className="rounded-[18px] border border-[#e7edf6] bg-[#f9fbff] px-4 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#95a3b7]">Semestre actuel</p>
            <p className="mt-3 text-[18px] font-semibold text-[#1f2a3d]">{currentSemester || '-'}</p>
          </div>
          <div className="rounded-[18px] border border-[#e7edf6] bg-[#f9fbff] px-4 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#95a3b7]">Examen régional</p>
            <p className="mt-3 text-[18px] font-semibold text-[#1f2a3d]">{config?.exam_regional_date || '-'}</p>
          </div>
        </div>
      </DirectorSurface>

      <div className="grid gap-5 xl:grid-cols-2">
        <DirectorSurface className="director-validation-section p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-[#18243a]">État des Validations</h2>
              <p className="mt-2 text-[15px] text-[#6b7a92]">
                Répartition claire des validations, avec un survol plus lisible et des repères fixes.
              </p>
            </div>
            <div className="director-validation-legend">
              {validationLegendItems.map((item) => (
                <div key={item.name} className="director-validation-legend-item">
                  <span className="director-validation-legend-dot" style={{ backgroundColor: item.color }} />
                  <span className="director-validation-legend-label">{item.name}</span>
                  <span className="director-validation-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={106} innerRadius={0} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: 'rgba(36, 99, 255, 0.08)' }}
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(148, 163, 184, 0.24)',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                    background: 'rgba(255, 255, 255, 0.96)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold text-[#18243a]">Progression par Filière</h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-[#697891]">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7c4ded]" />Validé</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d9dee8]" />En attente</span>
            </div>
          </div>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.filiere_progress || []} barCategoryGap={32}>
                <CartesianGrid stroke="#edf2f8" vertical={false} />
                <XAxis dataKey="filiere" tick={{ fill: '#7a879b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7a879b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="validated_percent" stackId="a" fill="#7c4ded" radius={[10, 10, 0, 0]} />
                <Bar dataKey="pending_percent" stackId="a" fill="#e6eaf2" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-6">
        <h2 className="text-[20px] font-semibold text-[#18243a]">Activités Récentes</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm uppercase tracking-[0.12em] text-[#7c8698]">
                <th className="px-3 py-2">Formateur</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.recent_activities || []).map((activity) => (
                <tr key={activity.id} className="rounded-[18px] bg-white">
                  <td className="px-3 py-4 text-[15px] font-medium text-[#18243a]">{activity.formateur_nom || '-'}</td>
                  <td className="px-3 py-4 text-[15px] text-[#2f3d55]">{activity.module_intitule || '-'}</td>
                  <td className="px-3 py-4">
                    <DirectorStatusPill status={activity.action_tone}>{activity.action_label}</DirectorStatusPill>
                  </td>
                  <td className="px-3 py-4 text-[15px] text-[#6b7a92]">{formatRelativeDate(activity.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DirectorSurface>
    </div>
  );
}
