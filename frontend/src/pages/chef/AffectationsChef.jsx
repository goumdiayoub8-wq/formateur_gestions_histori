import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, WandSparkles } from 'lucide-react';
import FormateurService from '../../services/formateurService';
import ModuleService from '../../services/moduleService';
import AffectationService from '../../services/affectationService';
import DashboardService from '../../services/dashboardService';
import AcademicConfigService from '../../services/academicConfigService';
import SmartAssignmentService from '../../services/smartAssignmentService';
import {
  buildModuleCode,
  buildTrainerStatsMap,
  dedupeAssignedModules,
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
  ChefSearchInput,
  ChefSection,
  ChefSelect,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';
import { Skeleton } from '../../components/ui/Skeleton';
import { PremiumTable, PremiumTableFooter } from '../../components/ui/PremiumTable';
import { Avatar } from '../../components/ui/Avatar';
import useDebouncedValue from '../../hooks/useDebouncedValue';

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
      className={`hover-card rounded-[28px] border bg-[var(--color-surface-strong)] px-6 py-5 shadow-sm dark:backdrop-blur-xl ${
        candidate.label === 'Meilleur match'
          ? 'border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] shadow-md'
          : 'border-[var(--color-border)]'
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
          <div className="flex items-center gap-3">
            <Avatar name={candidate.formateur.nom} size={48} />
            <div>
              <h3 className="text-[1.9rem] font-bold text-[var(--color-text-soft)]">
                {candidate.formateur.nom}
              </h3>
              <p className="mt-1 text-lg text-[var(--color-text-muted)]">{candidate.formateur.specialite}</p>
            </div>
          </div>
        </div>

        <ChefButton onClick={onAssign} disabled={!candidate.validation.valid || assigning}>
          {assigning ? 'Affectation...' : 'Assigner'}
        </ChefButton>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
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
              <span className="text-sm text-[var(--color-text-subtle)]">Aucun module affecte</span>
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
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card-muted)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-muted)]">Projection annuelle</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-soft)]">
            {formatHours(candidate.validation.projectedAnnual)}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card-muted)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-muted)]">Projection hebdo</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-soft)]">
            {formatHours(candidate.validation.projectedWeekly)}
          </p>
        </div>
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-4 py-4">
          <p className="text-sm text-[var(--color-text-muted)]">Projection S1 / S2</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-soft)]">
            {formatHours(candidate.validation.projectedS1Hours)} / {formatHours(candidate.validation.projectedS2Hours)}
          </p>
        </div>
      </div>

      {candidate.validation.errors.length ? (
        <div className="mt-5 rounded-[18px] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-4">
          {candidate.validation.errors.map((error) => (
            <p key={error} className="text-sm font-medium text-[var(--color-danger-text)]">
              {error}
            </p>
          ))}
        </div>
      ) : null}

      {candidate.validation.warnings.length ? (
        <div className="mt-4 rounded-[18px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-4">
          {candidate.validation.warnings.map((warning) => (
            <p key={warning} className="text-sm font-medium text-[var(--color-warning-text)]">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const PAGE_LIMIT = 5;

const assignmentTableBodyVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const assignmentTableRowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function AffectationsTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`affectations-skeleton-${index}`} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4"><Skeleton className="h-4 w-32 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-44 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-28 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-14 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="px-4 py-4">
            <div className="flex justify-end">
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AffectationsChef() {
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [backendSuggestions, setBackendSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [assignmentQuery, setAssignmentQuery] = useState('');
  const [assignmentRows, setAssignmentRows] = useState([]);
  const [assignmentCurrentPage, setAssignmentCurrentPage] = useState(1);
  const [assignmentTotalItems, setAssignmentTotalItems] = useState(0);
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1);
  const [formateurs, setFormateurs] = useState([]);
  const [modules, setModules] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(null);
  const { toasts, pushToast, dismissToast } = useChefToasts();
  const debouncedAssignmentQuery = useDebouncedValue(assignmentQuery.trim(), 300);

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

  const loadAssignmentRows = async (page = assignmentCurrentPage) => {
    try {
      setTableLoading(true);
      const response = await AffectationService.listPaginated({
        page,
        limit: PAGE_LIMIT,
        search: debouncedAssignmentQuery,
        annee: academicYear || undefined,
      });

      setAssignmentRows(Array.isArray(response?.data) ? response.data : []);
      setAssignmentTotalItems(safeNumber(response?.total_items, 0));
      setAssignmentTotalPages(Math.max(1, safeNumber(response?.total_pages, 1)));
      setAssignmentCurrentPage(Math.max(1, safeNumber(response?.current_page, 1)));
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Liste indisponible',
        description: loadError.message || "Impossible de charger les affectations actuelles.",
      });
    } finally {
      setTableLoading(false);
    }
  };

  const academicYear = useMemo(
    () => getAcademicYearValue(academicConfig),
    [academicConfig],
  );

  useEffect(() => {
    if (!academicYear) {
      return;
    }

    loadAssignmentRows(assignmentCurrentPage);
  }, [academicYear, assignmentCurrentPage, debouncedAssignmentQuery]);

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
        assignedModules: dedupeAssignedModules(
          Array.isArray(trainerStats.assigned_modules) && trainerStats.assigned_modules.length > 0
            ? trainerStats.assigned_modules
            : (candidate.modules || []).map((code) => ({
                id: `${trainerId}-${code}`,
                code,
                intitule: '',
              })),
        ),
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

  const isAssignmentSearchPending = assignmentQuery.trim() !== debouncedAssignmentQuery;

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

      await Promise.all([loadData(), loadAssignmentRows(assignmentCurrentPage)]);
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

  const handleRemoveAssignment = async (row) => {
    if (!window.confirm(`Liberer ${row.module_intitule} pour ${row.formateur_nom} ?`)) {
      return;
    }

    try {
      setRemovingId(row.id);
      await AffectationService.remove(row.id);
      pushToast({
        tone: 'success',
        title: 'Affectation retiree',
        description: `${row.module_intitule} est de nouveau disponible.`,
      });
      await Promise.all([loadData(), loadAssignmentRows(assignmentCurrentPage)]);
    } catch (error) {
      pushToast({
        tone: 'danger',
        title: 'Suppression impossible',
        description: error.message || "Impossible de retirer cette affectation.",
      });
    } finally {
      setRemovingId(null);
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

      <ChefSection
        title="Affectations actuelles"
        subtitle="Recherche debouncee, pagination uniforme et actions rapides sur les affectations deja en place."
      >
        <div className="space-y-4">
          <ChefSearchInput
            value={assignmentQuery}
            onChange={(value) => {
              setAssignmentQuery(value);
              setAssignmentCurrentPage(1);
            }}
            placeholder="Rechercher un formateur, un module ou une filiere..."
            className="h-16 rounded-3xl border-[color-mix(in_srgb,var(--color-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-strong)_78%,transparent)] backdrop-blur-xl"
          />

          <PremiumTable
            minWidthClassName="min-w-[980px]"
            columns={[
              { key: 'formateur', label: 'Formateur', className: 'w-[22%]' },
              { key: 'module', label: 'Module', className: 'w-[32%]' },
              { key: 'filiere', label: 'Filiere', className: 'w-[16%]' },
              { key: 'semestre', label: 'Semestre', className: 'w-[10%]' },
              { key: 'annee', label: 'Annee', className: 'w-[10%]' },
              { key: 'actions', label: 'Actions', className: 'w-[10%] text-right' },
            ]}
            footer={(
              <PremiumTableFooter
                currentPage={assignmentCurrentPage}
                totalPages={assignmentTotalPages}
                totalItems={assignmentTotalItems}
                itemCount={assignmentRows.length}
                loading={tableLoading || isAssignmentSearchPending}
                onPageChange={setAssignmentCurrentPage}
                pendingLabel="Recherche des affectations..."
              />
            )}
          >
            {tableLoading ? (
              <AffectationsTableSkeleton />
            ) : assignmentRows.length ? (
              <motion.tbody
                layout
                variants={assignmentTableBodyVariants}
                initial="hidden"
                animate="show"
              >
                {assignmentRows.map((row) => (
                  <motion.tr
                    key={row.id}
                    layout
                    variants={assignmentTableRowVariants}
                    className="hover-row border-t border-[var(--color-border)] transition hover:bg-[color-mix(in_srgb,var(--color-hover)_85%,transparent)]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.formateur_nom} size={36} />
                        <div>
                          <p className="font-semibold text-[var(--color-text-soft)]">{row.formateur_nom}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{row.formateur_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--color-text-soft)]">
                          {`${row.module_code ? `${row.module_code} - ` : ''}${row.module_intitule}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <ChefBadge tone="orange">{formatHours(row.volume_horaire)}</ChefBadge>
                          {safeNumber(row.has_efm) === 1 ? <ChefBadge tone="red">EFM</ChefBadge> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ChefBadge tone="violet">{row.filiere}</ChefBadge>
                    </td>
                    <td className="px-4 py-4">
                      <ChefBadge tone="green">{row.semestre}</ChefBadge>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-[var(--color-text-soft)]">
                      {row.annee}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <motion.button
                          type="button"
                          whileTap={{ scale: removingId === row.id ? 1 : 0.95 }}
                          disabled={removingId === row.id}
                          onClick={() => handleRemoveAssignment(row)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-danger-text)_30%,transparent)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] backdrop-blur disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={6} className="p-6">
                    <ChefEmptyState
                      title="Aucune affectation"
                      description="Aucune affectation ne correspond a la recherche active pour cette annee academique."
                    />
                  </td>
                </tr>
              </tbody>
            )}
          </PremiumTable>
        </div>
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
            <h3 className="mt-4 text-2xl font-bold text-[var(--color-text-soft)]">{selectedModule.intitule}</h3>
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
            <h2 className="text-[1.9rem] font-bold text-[var(--color-text-soft)]">
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
