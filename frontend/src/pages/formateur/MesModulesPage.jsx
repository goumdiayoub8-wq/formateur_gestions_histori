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
import ModulePreferenceSection from '../../components/formateur/ModulePreferenceSection';
import { BookOpen, Clock3, TrendingUp, Users } from 'lucide-react';

function formatHourValue(value) {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}h` : `${numericValue.toFixed(1).replace(/\.0$/, '')}h`;
}

function extractModulesFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.modules)) {
    return payload.modules;
  }

  if (Array.isArray(payload?.data?.modules)) {
    return payload.data.modules;
  }

  return [];
}

function QuestionnaireStatusBadge({ status }) {
  const isCompleted = status === 'completed';

  return (
    <span
      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
      }`}
    >
      {isCompleted ? 'Complété' : 'Non commencé'}
    </span>
  );
}

function ModuleOverviewItem({ module }) {
  const hasQuestionnaireLink = Boolean(module.questionnaire_token);

  return (
    <div className="hover-card theme-card-muted theme-border rounded-[20px] border px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="theme-text-primary text-[15px] font-bold">{module.code}</p>
          <p className="theme-text-muted mt-1 text-[14px]">{module.intitule}</p>
        </div>
        <FormateurSemesterBadge value={module.semestre} />
      </div>

      <div className="theme-text-muted mt-3 flex flex-wrap gap-3 text-[14px]">
        <span>{formatHourValue(module.weekly_hours)}/sem</span>
        <span>•</span>
        <span>{formatHourValue(module.volume_horaire)} total</span>
      </div>

      <div className="theme-text-muted mt-4 flex flex-wrap items-center gap-3 text-[13px]">
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
            className="hover-action inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1 font-semibold text-blue-600 transition-colors duration-300 dark:text-blue-200"
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
    <div className="hover-card theme-card-muted theme-border flex items-center justify-between gap-4 rounded-[20px] border px-5 py-4">
      <div className="min-w-0">
        <p className="theme-text-primary truncate text-[15px] font-bold">{group.code}</p>
        <p className="theme-text-muted mt-1 truncate text-[14px]">{group.nom}</p>
      </div>
      <p className="theme-text-primary shrink-0 text-[15px] font-semibold">{group.student_count} etudiants</p>
    </div>
  );
}

export default function MesModulesPage() {
  const [modules, setModules] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [preferencesPayload, setPreferencesPayload] = useState(null);
  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState([]);
  const [preferencesSubmitting, setPreferencesSubmitting] = useState(false);
  const [preferencesDirty, setPreferencesDirty] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError('');
        setPreferencesError('');

        const [planningModulesResult, statsResult, preferencesResult] = await Promise.allSettled([
          PlanningService.getMesModules(),
          PlanningService.getWeeklyStats(),
          FormateurService.getModulePreferences(),
        ]);

        if (!mounted) {
          return;
        }

        if (planningModulesResult.status === 'fulfilled') {
          setModules(
            extractModulesFromPayload(planningModulesResult.value).map((module) => {
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
        }

        if (statsResult.status === 'fulfilled') {
          setWeeklyStats(statsResult.value);
        }

        if (preferencesResult.status === 'fulfilled') {
          setPreferencesPayload(preferencesResult.value || null);
          setSelectedPreferenceIds(
            Array.isArray(preferencesResult.value?.selected_module_ids)
              ? preferencesResult.value.selected_module_ids.map((value) => Number(value))
              : [],
          );
          setPreferencesDirty(false);
        } else {
          setPreferencesError(preferencesResult.reason?.message || 'Impossible de charger les preferences modules.');
        }

        if (planningModulesResult.status === 'rejected' && statsResult.status === 'rejected') {
          setError(planningModulesResult.reason?.message || statsResult.reason?.message || 'Impossible de charger vos modules.');
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

  useEffect(() => {
    const poller = window.setInterval(async () => {
      if (preferencesDirty || preferencesSubmitting) {
        return;
      }

      try {
        const preferencesResponse = await FormateurService.getModulePreferences();
        setPreferencesPayload(preferencesResponse || null);
        setSelectedPreferenceIds(
          Array.isArray(preferencesResponse?.selected_module_ids)
            ? preferencesResponse.selected_module_ids.map((value) => Number(value))
            : [],
        );
      } catch (pollError) {
        void pollError;
      }
    }, 20000);

    return () => {
      window.clearInterval(poller);
    };
  }, [preferencesDirty, preferencesSubmitting]);

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

  const togglePreference = (moduleId) => {
    setSelectedPreferenceIds((current) => {
      const normalizedId = Number(moduleId);
      const nextSelection = current.includes(normalizedId)
        ? current.filter((value) => value !== normalizedId)
        : [...current, normalizedId];

      return nextSelection;
    });
    setPreferencesDirty(true);
  };

  const handleSubmitPreferences = async () => {
    try {
      setPreferencesSubmitting(true);
      setError('');
      const response = await FormateurService.submitModulePreferences(selectedPreferenceIds);
      setPreferencesPayload(response || null);
      setSelectedPreferenceIds(
        Array.isArray(response?.selected_module_ids)
          ? response.selected_module_ids.map((value) => Number(value))
          : [],
      );
      setPreferencesDirty(false);
    } catch (submitError) {
      setError(submitError?.message || 'Impossible d envoyer vos preferences.');
    } finally {
      setPreferencesSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-slate-200 border-t-blue-600 dark:border-white/10 dark:border-t-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="theme-card-muted rounded-[28px] border border-[var(--color-border)] px-6 py-7">
        <h1 className="theme-text-primary text-[22px] font-bold tracking-tight">Mes Modules</h1>
        <p className="theme-text-muted mt-2 text-[15px]">Modules que j&apos;enseigne ce semestre</p>
      </div>

      {error ? (
        <FormateurPanel className="theme-status-danger px-6 py-5 text-[15px] font-semibold">{error}</FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <FormateurStatCard
          icon={BookOpen}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-400/20 dark:text-violet-200"
          label="Modules actifs"
          value={modules.length}
        />
        <FormateurStatCard
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200"
          label="Total groupes"
          value={groups.length}
        />
        <FormateurStatCard
          icon={Clock3}
          iconClassName="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-400/20 dark:text-fuchsia-200"
          label="Heures/semaine"
          value={formatHourValue(weeklyStats?.weekly_hours || 0)}
        />
        <FormateurStatCard
          icon={TrendingUp}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-200"
          label="Progression moyenne"
          value={`${averageProgress}%`}
        />
      </div>

      <ModulePreferenceSection
        payload={preferencesPayload}
        selectedModuleIds={selectedPreferenceIds}
        onToggle={togglePreference}
        onSubmit={handleSubmitPreferences}
        submitting={preferencesSubmitting}
        hasDraft={preferencesDirty}
        error={preferencesError}
      />

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
                <tr className="theme-text-muted text-left text-[14px]">
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Module</th>
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Groupes</th>
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Semestre</th>
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Heures totales</th>
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Heures realisees</th>
                  <th className="border-b border-[var(--color-border)] px-2 py-4 font-semibold">Progression</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.id} className="hover-row">
                    <td className="border-b border-[var(--color-border)] px-2 py-4">
                      <p className="theme-text-primary text-[16px] font-semibold">
                        {module.code} - {module.intitule}
                      </p>
                      <p className="theme-text-muted mt-1 text-[14px]">
                        {formatHourValue(module.weekly_hours) || '0h'} par semaine
                      </p>
                      <div className="theme-text-muted mt-3 flex flex-wrap items-center gap-3 text-[13px]">
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
                            className="hover-action inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1 font-semibold text-blue-600 transition-colors duration-300 dark:text-blue-200"
                          >
                            Répondre au questionnaire
                          </Link>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-2 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(module.group_codes || []).map((code) => (
                          <span key={code} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1 text-[13px] text-[var(--color-text-muted)]">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-2 py-4">
                      <FormateurSemesterBadge value={module.semestre} />
                    </td>
                    <td className="border-b border-[var(--color-border)] px-2 py-4 text-[15px] text-[var(--color-text)]">
                      {formatHourValue(module.volume_horaire)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-2 py-4 text-[15px] text-[var(--color-text)]">
                      {formatHourValue(module.completed_hours)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-2 py-4">
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
              description="Aucun module n'est encore retourne pour ce formateur."
            />
          </div>
        )}
      </FormateurPanel>
    </div>
  );
}
