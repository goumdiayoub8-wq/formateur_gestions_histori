import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PlanningService from '../../services/planningService';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import {
  FormateurEmptyBlock,
  FormateurMiniProgress,
  FormateurPanel,
  FormateurSectionHeader,
  FormateurSemesterBadge,
  FormateurStatCard,
} from '../../components/formateur/FormateurUI';
import { BookOpen, Clock3, TrendingUp, Users } from 'lucide-react';

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function QuestionnaireStatusBadge({ status }) {
  const isCompleted = status === 'completed';

  return (
    <span
      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
        isCompleted
          ? 'bg-[#eafaf0] text-[#119548]'
          : 'bg-[#eef3f9] text-[#60748f]'
      }`}
    >
      {isCompleted ? 'Complété' : 'Non commencé'}
    </span>
  );
}

function ModuleOverviewItem({ module }) {
  const hasQuestionnaireLink = Boolean(module.questionnaire_token);

  return (
    <div className="rounded-[20px] bg-[#f7f9fd] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-bold text-[#1d2a3f]">{module.code}</p>
          <p className="mt-1 text-[14px] text-[#5f718a]">{module.intitule}</p>
        </div>
        <FormateurSemesterBadge value={module.semestre} />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[14px] text-[#7586a0]">
        <span>{formatHourValue(module.weekly_hours)}/sem</span>
        <span>•</span>
        <span>{formatHourValue(module.volume_horaire)} total</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#60748f]">
        <QuestionnaireStatusBadge status={module.questionnaire_status} />
        <span>
          Score: {module.questionnaire_score === null || module.questionnaire_score === undefined ? '--' : `${Math.round(Number(module.questionnaire_score))}%`}
        </span>
        {module.rank_in_module ? (
          <span>Rang {module.rank_in_module}/{module.total_formateurs || module.rank_in_module}</span>
        ) : null}
        {hasQuestionnaireLink ? (
          <Link
            to={`/questionnaire/${encodeURIComponent(module.questionnaire_token)}`}
            className="inline-flex rounded-full border border-[#d9e2ef] bg-white px-3 py-1 font-semibold text-[#3567ff]"
          >
            Répondre au questionnaire
          </Link>
        ) : (
          <span>Questionnaire indisponible</span>
        )}
      </div>
    </div>
  );
}

function GroupOverviewItem({ group }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#f7f9fd] px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-[#1d2a3f]">{group.code}</p>
        <p className="mt-1 truncate text-[14px] text-[#5f718a]">{group.nom}</p>
      </div>
      <p className="shrink-0 text-[15px] font-semibold text-[#1d2a3f]">{group.student_count} etudiants</p>
    </div>
  );
}

export default function MesModulesPage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');

        const [profileResponse, planningModules, statsResponse] = await Promise.all([
          FormateurService.getProfil(),
          PlanningService.getMesModules(),
          PlanningService.getWeeklyStats(),
        ]);

        if (!mounted) {
          return;
        }

        setProfile(profileResponse);
        setModules(
          (Array.isArray(planningModules) ? planningModules : []).map((module) => {
            return {
              ...module,
              weekly_hours: Number(module.weekly_hours || 0),
              completed_hours: Number(module.completed_hours || 0),
              progress_percent: Number(module.progress_percent || 0),
              group_codes: Array.isArray(module.group_codes) ? module.group_codes : [],
              groups: Array.isArray(module.groups)
                ? module.groups.map((group) => ({
                    ...group,
                    nom: group.nom || group.name || group.code,
                    student_count: Number(group.student_count || 0),
                  }))
                : [],
              questionnaire_status: module.questionnaire_status || 'not_started',
              questionnaire_score:
                module.questionnaire_score === null || module.questionnaire_score === undefined
                  ? null
                  : Number(module.questionnaire_score),
              questionnaire_token: module.questionnaire_token || null,
              rank_in_module:
                module.rank_in_module === null || module.rank_in_module === undefined
                  ? null
                  : Number(module.rank_in_module),
              total_formateurs:
                module.total_formateurs === null || module.total_formateurs === undefined
                  ? 0
                  : Number(module.total_formateurs),
            };
          }),
        );
        setWeeklyStats(statsResponse);
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || 'Impossible de charger vos modules.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const seen = new Map();

    modules.forEach((module) => {
      (module.groups || []).forEach((group) => {
        if (!seen.has(group.code)) {
          seen.set(group.code, {
            id: group.code,
            code: group.code,
            nom: group.nom || group.code,
            student_count: Number(group.student_count || 0),
          });
        }
      });
    });

    return Array.from(seen.values());
  }, [modules]);

  const averageProgress = useMemo(() => {
    if (!modules.length) {
      return 0;
    }

    return Math.round(
      modules.reduce((sum, module) => sum + Number(module.progress_percent || 0), 0) / modules.length,
    );
  }, [modules]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] bg-[#f7f9fd] px-6 py-7">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1f2a3d]">Mes Modules</h1>
        <p className="mt-2 text-[15px] text-[#75859c]">Modules que j&apos;enseigne ce semestre</p>
      </div>

      {error ? (
        <FormateurPanel className="px-6 py-5 text-[15px] font-semibold text-[#b54545]">{error}</FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <FormateurStatCard
          icon={BookOpen}
          iconClassName="bg-[#f4f1ff] text-[#6945ff]"
          label="Modules actifs"
          value={modules.length}
        />
        <FormateurStatCard
          icon={Users}
          iconClassName="bg-[#eef4ff] text-[#2663ff]"
          label="Total groupes"
          value={groups.length}
        />
        <FormateurStatCard
          icon={Clock3}
          iconClassName="bg-[#f7eeff] text-[#a020f0]"
          label="Heures/semaine"
          value={formatHourValue(weeklyStats?.weekly_hours || 0)}
        />
        <FormateurStatCard
          icon={TrendingUp}
          iconClassName="bg-[#edf9f0] text-[#07b34a]"
          label="Progression moyenne"
          value={`${averageProgress}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FormateurPanel className="p-6">
          <FormateurSectionHeader title="Mes Modules" />
          <div className="mt-6 space-y-4">
            {modules.length ? (
              modules.map((module) => <ModuleOverviewItem key={module.id} module={module} />)
            ) : (
              <FormateurEmptyBlock
                title="Aucun module disponible"
                description="Vos modules affectes apparaitront ici des qu ils seront disponibles dans le backend."
              />
            )}
          </div>
        </FormateurPanel>

        <FormateurPanel className="p-6">
          <FormateurSectionHeader title="Mes Groupes" />
          <div className="mt-6 space-y-4">
            {groups.length ? (
              groups.map((group) => <GroupOverviewItem key={group.id} group={group} />)
            ) : (
              <FormateurEmptyBlock
                title="Aucun groupe derive"
                description="Les groupes seront determines depuis les affectations et le mapping module-groupe."
              />
            )}
          </div>
        </FormateurPanel>
      </div>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Liste de mes modules" />
        {modules.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[14px] text-[#7b8ca5]">
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Module</th>
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Groupes</th>
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Semestre</th>
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Heures totales</th>
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Heures realisees</th>
                  <th className="border-b border-[#e7edf6] px-2 py-4 font-semibold">Progression</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.id}>
                    <td className="border-b border-[#edf2f8] px-2 py-4">
                      <p className="text-[16px] font-semibold text-[#1d2a3f]">
                        {module.code} - {module.intitule}
                      </p>
                      <p className="mt-1 text-[14px] text-[#7b8ca5]">
                        {formatHourValue(module.weekly_hours) || '0h'} par semaine
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#60748f]">
                        <QuestionnaireStatusBadge status={module.questionnaire_status} />
                        <span>
                          Score: {module.questionnaire_score === null || module.questionnaire_score === undefined ? '--' : `${Math.round(Number(module.questionnaire_score))}%`}
                        </span>
                        {module.rank_in_module ? (
                          <span>Rang {module.rank_in_module}/{module.total_formateurs || module.rank_in_module}</span>
                        ) : null}
                        {module.questionnaire_token ? (
                          <Link
                            to={`/questionnaire/${encodeURIComponent(module.questionnaire_token)}`}
                            className="inline-flex rounded-full border border-[#d9e2ef] bg-white px-3 py-1 font-semibold text-[#3567ff]"
                          >
                            Répondre au questionnaire
                          </Link>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-[#edf2f8] px-2 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(module.group_codes || []).map((code) => (
                          <span key={code} className="rounded-full border border-[#d9e2ef] bg-white px-3 py-1 text-[13px] text-[#3b4d67]">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-[#edf2f8] px-2 py-4">
                      <FormateurSemesterBadge value={module.semestre} />
                    </td>
                    <td className="border-b border-[#edf2f8] px-2 py-4 text-[15px] text-[#27364d]">
                      {formatHourValue(module.volume_horaire)}
                    </td>
                    <td className="border-b border-[#edf2f8] px-2 py-4 text-[15px] text-[#27364d]">
                      {formatHourValue(module.completed_hours)}
                    </td>
                    <td className="border-b border-[#edf2f8] px-2 py-4">
                      <FormateurMiniProgress value={module.progress_percent || 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <FormateurEmptyBlock
              title="Aucune ligne de module"
              description={`Aucun module n'est encore retourne pour ${profile?.nom || 'ce formateur'}.`}
            />
          </div>
        )}
      </FormateurPanel>
    </div>
  );
}
