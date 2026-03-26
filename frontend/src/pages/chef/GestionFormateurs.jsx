import React, { useEffect, useMemo, useState } from 'react';
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import FormateurService from '../../services/formateurService';
import AffectationService from '../../services/affectationService';
import PlanningService from '../../services/planningService';
import DashboardService from '../../services/dashboardService';
import AcademicConfigService from '../../services/academicConfigService';
import {
  buildTrainerStatsMap,
  formatHours,
  getAcademicWeekNumber,
  getLoadTone,
  mapAlertsByTrainer,
  safeNumber,
} from '../../utils/chefDashboard';
import {
  ChefBadge,
  ChefButton,
  ChefEmptyState,
  ChefField,
  ChefInput,
  ChefLoadingState,
  ChefModal,
  ChefProgress,
  ChefSearchInput,
  ChefSection,
  ChefSelect,
  ChefTableShell,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';

const EMPTY_FORM = {
  id: null,
  nom: '',
  email: '',
  specialite: '',
  max_heures: 910,
  mot_de_passe: '',
};

function buildStatusBadge(formateur, stats, alertsByTrainer) {
  const annualRatio =
    safeNumber(formateur.max_heures) > 0
      ? safeNumber(stats.annual_hours) / safeNumber(formateur.max_heures)
      : 0;
  const hasWeeklyOverload = safeNumber(stats.max_week_hours) > 26;
  const trainerAlerts = alertsByTrainer[safeNumber(formateur.id)] || [];

  if (annualRatio > 1 || hasWeeklyOverload) {
    return { tone: 'red', label: 'Depassement' };
  }

  if (trainerAlerts.length > 0 || annualRatio >= 0.93) {
    return { tone: 'orange', label: 'Surveillance' };
  }

  return { tone: 'green', label: 'OK' };
}

function getScorePresentation(percentage) {
  const value = Number(percentage);

  if (!Number.isFinite(value)) {
    return {
      label: 'Non evalue',
      tone: 'slate',
      progressTone: 'slate',
      percentage: null,
    };
  }

  if (value >= 75) {
    return {
      label: 'Excellent',
      tone: 'green',
      progressTone: 'green',
      percentage: value,
    };
  }

  if (value >= 50) {
    return {
      label: 'Good',
      tone: 'orange',
      progressTone: 'orange',
      percentage: value,
    };
  }

  return {
    label: 'Needs improvement',
    tone: 'red',
    progressTone: 'red',
    percentage: value,
  };
}

export default function GestionFormateurs() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [formateurs, setFormateurs] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [planningEntries, setPlanningEntries] = useState([]);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { toasts, pushToast, dismissToast } = useChefToasts();

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        formateursResponse,
        affectationsResponse,
        planningResponse,
        dashboardResponse,
        academicConfigResponse,
      ] = await Promise.all([
        FormateurService.list(),
        AffectationService.list(),
        PlanningService.getWeeklyPlanning(),
        DashboardService.getStats(),
        AcademicConfigService.getConfig(),
      ]);

      setFormateurs(Array.isArray(formateursResponse) ? formateursResponse : []);
      setAffectations(Array.isArray(affectationsResponse) ? affectationsResponse : []);
      setPlanningEntries(Array.isArray(planningResponse) ? planningResponse : []);
      setDashboardPayload(dashboardResponse || {});
      setAcademicConfig(academicConfigResponse || null);
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Chargement impossible',
        description: loadError.message || 'Impossible de charger les formateurs.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const alertsByTrainer = useMemo(
    () => mapAlertsByTrainer(dashboardPayload?.alerts || []),
    [dashboardPayload],
  );

  const filteredFormateurs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return formateurs;
    }

    return formateurs.filter((formateur) =>
      [formateur.nom, formateur.email, formateur.specialite]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [formateurs, query]);

  const totals = useMemo(() => {
    return formateurs.reduce(
      (accumulator, formateur) => {
        const stats = trainerStatsMap[safeNumber(formateur.id)] || {};
        accumulator.annual += safeNumber(stats.annual_hours);
        accumulator.weekly += safeNumber(stats.current_week_hours);
        accumulator.alerts += (alertsByTrainer[safeNumber(formateur.id)] || []).length;
        return accumulator;
      },
      { annual: 0, weekly: 0, alerts: 0 },
    );
  }, [alertsByTrainer, formateurs, trainerStatsMap]);

  const openCreateModal = () => {
    setFormError('');
    setFormValues(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (formateur) => {
    setFormError('');
    setFormValues({
      id: formateur.id,
      nom: formateur.nom || '',
      email: formateur.email || '',
      specialite: formateur.specialite || '',
      max_heures: safeNumber(formateur.max_heures, 910),
      mot_de_passe: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFormError('');

      const payload = {
        nom: formValues.nom.trim(),
        email: formValues.email.trim(),
        specialite: formValues.specialite.trim(),
        max_heures: safeNumber(formValues.max_heures, 910),
        ...(formValues.mot_de_passe ? { mot_de_passe: formValues.mot_de_passe } : {}),
      };

      if (formValues.id) {
        await FormateurService.update(formValues.id, payload);
        pushToast({
          tone: 'success',
          title: 'Formateur mis a jour',
          description: `${payload.nom} a ete modifie avec succes.`,
        });
      } else {
        await FormateurService.create(payload);
        pushToast({
          tone: 'success',
          title: 'Formateur ajoute',
          description: `${payload.nom} est disponible pour les affectations.`,
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (saveError) {
      setFormError(saveError.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (formateur) => {
    if (!window.confirm(`Supprimer le formateur "${formateur.nom}" ?`)) {
      return;
    }

    try {
      setDeletingId(formateur.id);
      await FormateurService.remove(formateur.id);
      pushToast({
        tone: 'success',
        title: 'Formateur supprime',
        description: `${formateur.nom} a ete retire du catalogue.`,
      });
      await loadData();
    } catch (deleteError) {
      pushToast({
        tone: 'danger',
        title: 'Suppression impossible',
        description: deleteError.message || 'Le formateur n a pas pu etre supprime.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <ChefLoadingState label="Chargement des formateurs..." />;
  }

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefSection
        title="Gestion des Formateurs"
        subtitle="Gerer les formateurs et leurs affectations, avec suivi annuel, repartition S1 / S2 et charge hebdomadaire."
        action={
          <ChefButton icon={Plus} onClick={openCreateModal}>
            Ajouter Formateur
          </ChefButton>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <ChefSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher par nom ou specialite..."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-4 py-4">
              <p className="text-sm text-[#70839c]">Formateurs</p>
              <p className="mt-2 text-3xl font-bold text-[#1b2941]">{formateurs.length}</p>
            </div>
            <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-4 py-4">
              <p className="text-sm text-[#70839c]">Heures cumulees</p>
              <p className="mt-2 text-3xl font-bold text-[#1b2941]">{formatHours(totals.annual)}</p>
            </div>
            <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-4 py-4">
              <p className="text-sm text-[#70839c]">Alertes</p>
              <p className="mt-2 text-3xl font-bold text-[#1b2941]">{totals.alerts}</p>
            </div>
          </div>
        </div>
      </ChefSection>

      <ChefTableShell>
        {filteredFormateurs.length ? (
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[linear-gradient(90deg,_#2f71f5_0%,_#2451ff_100%)] text-sm uppercase tracking-[0.14em] text-white">
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Specialite</th>
                <th className="px-6 py-4">Modules enseignes</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Heures cumulees</th>
                <th className="px-6 py-4">Score (%)</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormateurs.map((formateur) => {
                const stats = trainerStatsMap[safeNumber(formateur.id)] || {};
                const status = buildStatusBadge(formateur, stats, alertsByTrainer);
                const annualRatio =
                  safeNumber(formateur.max_heures) > 0
                    ? safeNumber(stats.annual_hours) / safeNumber(formateur.max_heures)
                    : 0;
                const assignedModules = stats.assigned_modules || [];
                const scorePresentation = getScorePresentation(formateur.questionnaire_percentage);

                return (
                  <tr key={formateur.id} className="border-t border-[#e9eef7] align-top">
                    <td className="px-6 py-5">
                      <p className="text-lg font-semibold text-[#1b2941]">{formateur.nom}</p>
                      <p className="mt-1 text-sm text-[#7b8ea8]">
                        Hebdo actuel {formatHours(stats.current_week_hours)} · Max {formatHours(stats.max_week_hours)}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-base text-[#50637d]">{formateur.specialite}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {assignedModules.length ? (
                          assignedModules.map((module) => (
                            <ChefBadge key={`${formateur.id}-${module.id}`} tone="blue">
                              {module.code}
                            </ChefBadge>
                          ))
                        ) : (
                          <span className="text-sm text-[#8fa1b8]">Aucun module</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#61748e]">
                      <p>{formateur.telephone || '+212 ...'}</p>
                      <p className="mt-1">{formateur.email}</p>
                    </td>
                    <td className="min-w-[280px] px-6 py-5">
                      <div className="space-y-3">
                        <p className="text-xl font-semibold text-[#1b2941]">
                          {formatHours(stats.annual_hours)} / {formatHours(formateur.max_heures)}
                        </p>
                        <ChefProgress
                          value={stats.annual_hours}
                          max={formateur.max_heures}
                          tone={
                            getLoadTone(annualRatio) === 'danger'
                              ? 'red'
                              : getLoadTone(annualRatio) === 'warning'
                                ? 'orange'
                                : 'green'
                          }
                          rightLabel={`${Math.round(annualRatio * 100)}%`}
                        />
                        <p className="text-sm text-[#7b8ea8]">
                          S1 {formatHours(stats.s1_hours)} · S2 {formatHours(stats.s2_hours)}
                        </p>
                      </div>
                    </td>
                    <td className="min-w-[220px] px-6 py-5">
                      {scorePresentation.percentage === null ? (
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-[#61748e]">Non evalue</p>
                          <p className="text-sm text-[#8fa1b8]">
                            Aucun questionnaire soumis
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xl font-semibold text-[#1b2941]">
                            {Math.round(scorePresentation.percentage)}%
                          </p>
                          <ChefProgress
                            value={scorePresentation.percentage}
                            max={100}
                            tone={scorePresentation.progressTone}
                            rightLabel={`${Math.round(scorePresentation.percentage)}%`}
                          />
                          <ChefBadge tone={scorePresentation.tone}>
                            {scorePresentation.label}
                          </ChefBadge>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-2">
                        <ChefBadge tone={status.tone}>{status.label}</ChefBadge>
                        {(alertsByTrainer[safeNumber(formateur.id)] || []).length ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#d1624c]">
                            <TriangleAlert className="h-4 w-4" />
                            {(alertsByTrainer[safeNumber(formateur.id)] || []).length} alerte(s)
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(formateur)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dce5f1] bg-white text-[#445873]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === formateur.id}
                          onClick={() => handleDelete(formateur)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#ffd5d5] bg-[#fff5f5] text-[#cf4c4c] disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <ChefEmptyState
              title="Aucun formateur"
              description="Ajoutez un formateur pour commencer les affectations et le suivi de charge."
            />
          </div>
        )}
      </ChefTableShell>

      <ChefModal
        open={modalOpen}
        title={formValues.id ? 'Modifier le formateur' : 'Ajouter un formateur'}
        subtitle="Les champs envoient directement les donnees attendues par l API existante."
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <ChefButton variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </ChefButton>
            <ChefButton onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : formValues.id ? 'Mettre a jour' : 'Creer'}
            </ChefButton>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ChefField label="Nom complet" error={formError && !formValues.nom ? formError : ''}>
            <ChefInput
              value={formValues.nom}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, nom: event.target.value }))
              }
              placeholder="Nom complet"
            />
          </ChefField>
          <ChefField label="Email">
            <ChefInput
              type="email"
              value={formValues.email}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="formateur@ofppt.ma"
            />
          </ChefField>
          <ChefField label="Specialite">
            <ChefInput
              value={formValues.specialite}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, specialite: event.target.value }))
              }
              placeholder="Developpement web"
            />
          </ChefField>
          <ChefField label="Limite annuelle">
            <ChefInput
              type="number"
              min="1"
              value={formValues.max_heures}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  max_heures: event.target.value,
                }))
              }
            />
          </ChefField>
          {!formValues.id ? (
            <ChefField
              label="Mot de passe"
              help="Optionnel si le backend gere deja la creation securisee."
            >
              <ChefInput
                type="password"
                value={formValues.mot_de_passe}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    mot_de_passe: event.target.value,
                  }))
                }
                placeholder="Optionnel"
              />
            </ChefField>
          ) : null}
        </div>
        {formError ? <p className="mt-4 text-sm font-semibold text-[#cf4c4c]">{formError}</p> : null}
      </ChefModal>
    </div>
  );
}
