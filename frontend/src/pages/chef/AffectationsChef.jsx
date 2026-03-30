import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, WandSparkles } from 'lucide-react';
import FormateurService from '../../services/formateurService';
import ModuleService from '../../services/moduleService';
import AffectationService from '../../services/affectationService';
import DashboardService from '../../services/dashboardService';
import AcademicConfigService from '../../services/academicConfigService';
import SmartAssignmentService from '../../services/smartAssignmentService';
import {
  buildModuleCode,
  buildTrainerStatsMap,
  formatHours,
  getAcademicYearValue,
  safeNumber,
} from '../../utils/chefDashboard';
import {
  ChefAlertBanner,
  ChefBadge,
  ChefButton,
  ChefEmptyState,
  ChefLoadingState,
  ChefPageHero,
  ChefProgress,
  ChefSection,
  ChefSelect,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';

function CandidateCard({ candidate, onAssign, assigning }) {
  const compatibility = Math.max(0, Math.min(100, candidate.score));
  const tone =
    candidate.label === 'Meilleur match'
      ? 'orange'
      : candidate.validation.valid
        ? 'green'
        : 'red';

  return (
    <div
      className={`rounded-[28px] border bg-white px-6 py-5 shadow-[0_18px_36px_rgba(39,74,129,0.08)] ${
        candidate.label === 'Meilleur match'
          ? 'border-[#d58eff] shadow-[0_20px_40px_rgba(167,90,247,0.14)]'
          : 'border-[#dce6f3]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <ChefBadge tone={tone}>{candidate.label}</ChefBadge>
            {candidate.validation.valid ? (
              <ChefBadge tone="blue">Compatible</ChefBadge>
            ) : (
              <ChefBadge tone="red">Bloque</ChefBadge>
            )}
          </div>
          <h3 className="text-[1.9rem] font-bold text-[#1b2941]">
            {candidate.formateur.nom}
          </h3>
          <p className="mt-1 text-lg text-[#6e8199]">{candidate.formateur.specialite}</p>
        </div>

        <ChefButton onClick={onAssign} disabled={!candidate.validation.valid || assigning}>
          {assigning ? 'Affectation...' : 'Assigner'}
        </ChefButton>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8ca0bb]">
            Modules enseignes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.assignedModules.length ? (
              candidate.assignedModules.map((module) => (
                <ChefBadge key={`${candidate.id}-${module.id}`} tone="blue">
                  {module.code}
                </ChefBadge>
              ))
            ) : (
              <span className="text-sm text-[#8da0ba]">Aucun module affecte</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <ChefProgress
            value={candidate.remainingHours}
            max={safeNumber(candidate.formateur.max_heures, 910)}
            tone="green"
            label="Heures restantes"
            rightLabel={formatHours(candidate.remainingHours)}
          />
          <ChefProgress
            value={compatibility}
            max={100}
            tone="violet"
            label="Compatibilite"
            rightLabel={`${compatibility}%`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[18px] border border-[#e8eef7] bg-[#fbfdff] px-4 py-4">
          <p className="text-sm text-[#7d90aa]">Projection annuelle</p>
          <p className="mt-2 text-2xl font-bold text-[#1b2941]">
            {formatHours(candidate.validation.projectedAnnual)}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e8eef7] bg-[#fbfdff] px-4 py-4">
          <p className="text-sm text-[#7d90aa]">Projection hebdo</p>
          <p className="mt-2 text-2xl font-bold text-[#1b2941]">
            {formatHours(candidate.validation.projectedWeekly)}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e8eef7] bg-[#fbfdff] px-4 py-4">
          <p className="text-sm text-[#7d90aa]">Projection S1 / S2</p>
          <p className="mt-2 text-2xl font-bold text-[#1b2941]">
            {formatHours(candidate.validation.projectedS1Hours)} / {formatHours(candidate.validation.projectedS2Hours)}
          </p>
        </div>
      </div>

      {candidate.validation.errors.length ? (
        <div className="mt-5 rounded-[18px] border border-[#ffd3d3] bg-[#fff5f5] px-4 py-4">
          {candidate.validation.errors.map((error) => (
            <p key={error} className="text-sm font-medium text-[#cf4c4c]">
              {error}
            </p>
          ))}
        </div>
      ) : null}

      {candidate.validation.warnings.length ? (
        <div className="mt-4 rounded-[18px] border border-[#ffe1ad] bg-[#fff8ea] px-4 py-4">
          {candidate.validation.warnings.map((warning) => (
            <p key={warning} className="text-sm font-medium text-[#c17c17]">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AffectationsChef() {
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [backendSuggestions, setBackendSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [formateurs, setFormateurs] = useState([]);
  const [modules, setModules] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(null);
  const { toasts, pushToast, dismissToast } = useChefToasts();

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        formateursResponse,
        modulesResponse,
        affectationsResponse,
        dashboardResponse,
        academicConfigResponse,
      ] = await Promise.all([
        FormateurService.list(),
        ModuleService.list(),
        AffectationService.list(),
        DashboardService.getStats(),
        AcademicConfigService.getConfig(),
      ]);

      setFormateurs(Array.isArray(formateursResponse) ? formateursResponse : []);
      setModules(Array.isArray(modulesResponse) ? modulesResponse : []);
      setAffectations(Array.isArray(affectationsResponse) ? affectationsResponse : []);
      setDashboardPayload(dashboardResponse || {});
      setAcademicConfig(academicConfigResponse || null);
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Chargement impossible',
        description: loadError.message || "Impossible de charger les donnees d'affectation.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const academicYear = useMemo(
    () => getAcademicYearValue(academicConfig),
    [academicConfig],
  );

  const trainerStatsMap = useMemo(
    () =>
      buildTrainerStatsMap({
        formateurs,
        affectations,
        dashboardStats: dashboardPayload?.formateurs || [],
        academicYear,
      }),
    [academicYear, affectations, dashboardPayload, formateurs],
  );

  const trainerMap = useMemo(
    () => new Map(formateurs.map((formateur) => [safeNumber(formateur.id), formateur])),
    [formateurs],
  );

  const assignedModuleIds = useMemo(
    () =>
      new Set(
        affectations
          .filter((row) => safeNumber(row.annee) === safeNumber(academicYear))
          .map((row) => safeNumber(row.module_id)),
      ),
    [academicYear, affectations],
  );

  const availableModules = useMemo(
    () =>
      modules.filter((module) => !assignedModuleIds.has(safeNumber(module.id))),
    [assignedModuleIds, modules],
  );

  const selectedModule = useMemo(
    () => availableModules.find((module) => safeNumber(module.id) === safeNumber(selectedModuleId)),
    [availableModules, selectedModuleId],
  );

  useEffect(() => {
    let active = true;

    const loadSuggestions = async () => {
      if (!selectedModule) {
        setSuggestionsLoading(false);
        setBackendSuggestions([]);
        return;
      }

      try {
        setSuggestionsLoading(true);
        const response = await SmartAssignmentService.getSuggestions(selectedModule.id);
        if (active) {
          setBackendSuggestions(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setBackendSuggestions([]);
        pushToast({
          tone: 'danger',
          title: 'Suggestions indisponibles',
          description:
            error.message || "Impossible de recuperer les suggestions du backend.",
        });
      } finally {
        if (active) {
          setSuggestionsLoading(false);
        }
      }
    };

    loadSuggestions();

    return () => {
      active = false;
    };
  }, [pushToast, selectedModule]);

  const suggestions = useMemo(() => {
    if (!selectedModule) {
      return [];
    }

    return backendSuggestions.map((candidate) => {
      const trainerId = safeNumber(candidate.id);
      const trainer = trainerMap.get(trainerId) || {};
      const trainerStats = trainerStatsMap[trainerId] || {};
      const annualLimit = safeNumber(
        trainerStats.max_heures,
        safeNumber(trainer.max_heures, 910),
      );
      const moduleHours = safeNumber(selectedModule.volume_horaire);
      const semester = String(selectedModule.semestre || '').toUpperCase();

      return {
        id: trainerId,
        score: safeNumber(candidate.score),
        remainingHours: safeNumber(candidate.heures_restantes),
        assignedModules:
          Array.isArray(trainerStats.assigned_modules) && trainerStats.assigned_modules.length > 0
            ? trainerStats.assigned_modules
            : (candidate.modules || []).map((code) => ({
                id: `${trainerId}-${code}`,
                code,
                intitule: '',
              })),
        formateur: {
          ...trainer,
          nom: candidate.name || trainer.nom || 'Formateur',
          specialite: candidate.specialite || trainer.specialite || '',
          max_heures: annualLimit,
        },
        label: candidate.badge === 'best_match' ? 'Meilleur match' : 'Recommande',
        backendReason: candidate.reason || null,
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          projectedAnnual: safeNumber(trainerStats.annual_hours) + moduleHours,
          projectedWeekly: safeNumber(candidate.reason?.details?.projected_weekly_hours),
          projectedS1Hours: safeNumber(trainerStats.s1_hours) + (semester === 'S1' ? moduleHours : 0),
          projectedS2Hours: safeNumber(trainerStats.s2_hours) + (semester === 'S2' ? moduleHours : 0),
        },
      };
    });
  }, [
    backendSuggestions,
    selectedModule,
    trainerMap,
    trainerStatsMap,
  ]);

  const bestCandidate = useMemo(
    () => suggestions[0] || null,
    [suggestions],
  );

  const handleAssign = async (candidate) => {
    if (!selectedModule) {
      return;
    }

    try {
      setAssigningId(candidate.id);
      await SmartAssignmentService.assign({
        formateur_id: candidate.id,
        module_id: selectedModule.id,
      });

      pushToast({
        tone: 'success',
        title: 'Affectation enregistree',
        description: `${buildModuleCode(selectedModule)} a ete affecte a ${candidate.formateur.nom}.`,
      });

      await loadData();
      setSelectedModuleId('');
    } catch (assignError) {
      pushToast({
        tone: 'danger',
        title: 'Affectation refusee',
        description: assignError.message || "L affectation n'a pas pu etre creee.",
      });
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return <ChefLoadingState label="Chargement des suggestions d affectation..." />;
  }

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefPageHero
        icon={Sparkles}
        title="Appariement intelligent"
        subtitle="Selectionnez un module libre, laissez le moteur classer les formateurs compatibles puis affectez en respectant 910h/an, 44h/semaine, EFM unique et l equilibre semestriel."
      />

      <ChefSection
        title="Selectionner un module a assigner"
        subtitle="Seuls les modules encore libres pour l annee academique en cours sont proposes."
      >
        {availableModules.length ? (
          <ChefSelect
            value={selectedModuleId}
            onChange={(event) => setSelectedModuleId(event.target.value)}
            className="h-16 text-lg"
          >
            <option value="">Selectionner un module</option>
            {availableModules.map((module) => (
              <option key={module.id} value={module.id}>
                {buildModuleCode(module)} - {module.intitule} - {module.filiere}
              </option>
            ))}
          </ChefSelect>
        ) : (
          <ChefEmptyState
            title="Tous les modules sont deja affectes"
            description="Le moteur d appariement redeviendra disponible des qu un nouveau module sera cree ou qu une affectation sera liberee."
          />
        )}
      </ChefSection>

      {selectedModule ? (
        <>
          <ChefSection
            title="Module selectionne"
            subtitle="Le systeme projette la charge hebdomadaire a partir de la duree du semestre academique pour fournir une validation inline fiable avant soumission."
            action={
              bestCandidate ? (
                <ChefButton
                  icon={WandSparkles}
                  variant="secondary"
                  onClick={() => handleAssign(bestCandidate)}
                  disabled={assigningId !== null}
                >
                  Auto-assigner (Meilleur)
                </ChefButton>
              ) : null
            }
          >
            <div className="flex flex-wrap gap-3">
              <ChefBadge tone="violet">{buildModuleCode(selectedModule)}</ChefBadge>
              <ChefBadge tone="blue">{selectedModule.filiere}</ChefBadge>
              <ChefBadge tone="green">{selectedModule.semestre}</ChefBadge>
              <ChefBadge tone="orange">{formatHours(selectedModule.volume_horaire)}</ChefBadge>
              {selectedModule.has_efm ? <ChefBadge tone="red">EFM</ChefBadge> : null}
            </div>
            <h3 className="mt-4 text-2xl font-bold text-[#1b2941]">{selectedModule.intitule}</h3>
          </ChefSection>

          {!suggestions.some((candidate) => candidate.validation.valid) ? (
            <ChefAlertBanner
              tone="warning"
              title="Aucun candidat pleinement compatible"
              description="Le module ne peut etre affecte a aucun formateur sans enfreindre au moins une regle metier. Consultez les cartes ci-dessous pour identifier le blocage."
            />
          ) : null}

          {suggestionsLoading ? (
            <ChefAlertBanner
              tone="info"
              title="Suggestions backend en cours de chargement"
              description="Le classement est synchronise avec le moteur backend et peut se raffiner pendant quelques instants."
            />
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[1.9rem] font-bold text-[#1b2941]">
              Suggestions IA ({suggestions.length})
            </h2>
          </div>

          <div className="space-y-5">
            {suggestions.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                assigning={assigningId === candidate.id}
                onAssign={() => handleAssign(candidate)}
              />
            ))}
          </div>
        </>
      ) : availableModules.length ? (
        <ChefEmptyState
          title="Choisissez un module pour lancer les suggestions"
          description="Des que vous selectionnez un module, le moteur classe automatiquement les formateurs par compatibilite et bloque toute action invalide."
        />
      ) : null}
    </div>
  );
}
