import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import FormateurService from '../../services/formateurService';
import AffectationService from '../../services/affectationService';
import DashboardService from '../../services/dashboardService';
import AcademicConfigService from '../../services/academicConfigService';
import {
  buildTrainerStatsMap,
  formatHours,
  getAcademicYearValue,
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
  ChefModal,
  ChefProgress,
  ChefSearchInput,
  ChefSection,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';
import FormateurPreferenceReviewCard from '../../components/chef/FormateurPreferenceReviewCard';
import { Skeleton } from '../../components/ui/Skeleton';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { PremiumTable, PremiumTableFooter } from '../../components/ui/PremiumTable';
import { Avatar } from '../../components/ui/Avatar';

const EMPTY_FORM = {
  id: null,
  nom: '',
  email: '',
  specialite: '',
  weekly_hours: '',
  max_heures: 910,
  mot_de_passe: '',
};

const PAGE_LIMIT = 5;

const tableBodyVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function HoverDetailsCard({
  title,
  lines = [],
  align = 'left',
  children,
}) {
  const visibleLines = lines.filter((line) => typeof line === 'string' && line.trim().length > 0);

  if (!visibleLines.length) {
    return children;
  }

  return (
    <div
      className={cn(
        'group/hovercard relative min-w-0',
        align === 'center' && 'flex justify-center',
      )}
      tabIndex={0}
    >
      {children}
      <div
        className={cn(
          'pointer-events-none absolute top-full z-30 mt-3 w-max max-w-[320px] rounded-[22px] border border-slate-200/80 bg-white/97 p-4 text-left shadow-[0_22px_44px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-200',
          'translate-y-2 opacity-0 group-hover/hovercard:translate-y-0 group-hover/hovercard:opacity-100 group-focus-visible/hovercard:translate-y-0 group-focus-visible/hovercard:opacity-100',
          'dark:border-white/10 dark:bg-slate-950/96 dark:shadow-[0_24px_54px_rgba(2,6,23,0.48)]',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
        )}
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {visibleLines.map((line) => (
            <p
              key={`${title}-${line}`}
              className="break-words text-sm leading-6 text-slate-800 dark:text-slate-100"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildStatusBadge(formateur, stats, alertsByTrainer) {
  const annualRatio =
    safeNumber(formateur.max_heures) > 0
      ? safeNumber(stats.annual_hours) / safeNumber(formateur.max_heures)
      : 0;
  const hasWeeklyOverload = safeNumber(stats.max_week_hours) > 44;
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

function SummaryCard({ label, value, helper = '', loading = false }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-5 shadow-sm dark:backdrop-blur-xl">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-2xl" />
          <Skeleton className="h-3 w-28 rounded-full" />
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(71,85,105)] dark:text-[rgb(203,213,225)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-soft)]">
            {value}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{helper}</p>
        </>
      )}
    </div>
  );
}

function FormateursTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`formateurs-skeleton-${index}`} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-1 h-9 w-9 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-3 w-52 rounded-full" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-36 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="h-8 w-24 rounded-full" />
          </td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function GestionFormateurs() {
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [formateurs, setFormateurs] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [academicConfig, setAcademicConfig] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [expandedTrainerId, setExpandedTrainerId] = useState(null);
  const [preferencePayloads, setPreferencePayloads] = useState({});
  const [preferenceMessages, setPreferenceMessages] = useState({});
  const [preferenceDecisions, setPreferenceDecisions] = useState({});
  const [preferenceLoadingId, setPreferenceLoadingId] = useState(null);
  const [preferenceSavingId, setPreferenceSavingId] = useState(null);
  const { toasts, pushToast, dismissToast } = useChefToasts();
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const fetchInsights = async () => {
    const [affectationsResponse, dashboardResponse, academicConfigResponse] = await Promise.all([
      AffectationService.list(),
      DashboardService.getStats(),
      AcademicConfigService.getConfig(),
    ]);

    return {
      affectations: Array.isArray(affectationsResponse) ? affectationsResponse : [],
      dashboardPayload: dashboardResponse || {},
      academicConfig: academicConfigResponse || null,
    };
  };

  const applyInsightsPayload = (payload) => {
    setAffectations(payload.affectations);
    setDashboardPayload(payload.dashboardPayload);
    setAcademicConfig(payload.academicConfig);
  };

  const fetchFormateurPage = async (page = currentPage, search = debouncedQuery) => {
    const response = await FormateurService.listPaginated({
      page,
      limit: PAGE_LIMIT,
      search,
    });
    const rows = Array.isArray(response?.data) ? response.data : [];
    const resolvedTotalItems = safeNumber(response?.total_items, rows.length);
    const resolvedTotalPages = Math.max(1, safeNumber(response?.total_pages, 1));
    const resolvedCurrentPage = Math.max(1, safeNumber(response?.current_page, 1));

    return {
      rows,
      totalItems: resolvedTotalItems,
      totalPages: resolvedTotalPages,
      currentPage: resolvedCurrentPage,
    };
  };

  const applyFormateurPagePayload = (payload) => {
    setFormateurs(payload.rows);
    setTotalItems(payload.totalItems);
    setTotalPages(payload.totalPages);
    setCurrentPage((previousPage) =>
      previousPage === payload.currentPage ? previousPage : payload.currentPage,
    );
  };

  const refreshInsights = async () => {
    setInsightsLoading(true);

    try {
      const payload = await fetchInsights();
      applyInsightsPayload(payload);
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Chargement impossible',
        description: loadError.message || 'Impossible de charger les indicateurs.',
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  const refreshTable = async (page = currentPage, search = debouncedQuery) => {
    setTableLoading(true);

    try {
      const payload = await fetchFormateurPage(page, search);
      applyFormateurPagePayload(payload);
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Chargement impossible',
        description: loadError.message || 'Impossible de charger les formateurs.',
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setInsightsLoading(true);

      try {
        const payload = await fetchInsights();

        if (!active) {
          return;
        }

        applyInsightsPayload(payload);
      } catch (loadError) {
        if (!active) {
          return;
        }

        pushToast({
          tone: 'danger',
          title: 'Chargement impossible',
          description: loadError.message || 'Impossible de charger les indicateurs.',
        });
      } finally {
        if (active) {
          setInsightsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setTableLoading(true);

      try {
        const payload = await fetchFormateurPage(currentPage, debouncedQuery);

        if (!active) {
          return;
        }

        applyFormateurPagePayload(payload);
      } catch (loadError) {
        if (!active) {
          return;
        }

        pushToast({
          tone: 'danger',
          title: 'Chargement impossible',
          description: loadError.message || 'Impossible de charger les formateurs.',
        });
      } finally {
        if (active) {
          setTableLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [currentPage, debouncedQuery]);

  useEffect(() => {
    if (!expandedTrainerId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadTrainerPreferences(expandedTrainerId, { silent: true });
    }, 20000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expandedTrainerId]);

  useEffect(() => {
    if (expandedTrainerId && !formateurs.some((formateur) => formateur.id === expandedTrainerId)) {
      setExpandedTrainerId(null);
    }
  }, [expandedTrainerId, formateurs]);

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

  const alertsByTrainer = useMemo(
    () => mapAlertsByTrainer(dashboardPayload?.alerts || []),
    [dashboardPayload],
  );

  const totals = useMemo(() => {
    const dashboardRows = Array.isArray(dashboardPayload?.formateurs) ? dashboardPayload.formateurs : [];

    return dashboardRows.reduce(
      (accumulator, formateur) => {
        accumulator.annual += safeNumber(formateur.annual_hours);
        accumulator.weekly += safeNumber(formateur.current_week_hours);
        return accumulator;
      },
      {
        annual: 0,
        weekly: 0,
        alerts: Array.isArray(dashboardPayload?.alerts) ? dashboardPayload.alerts.length : 0,
      },
    );
  }, [dashboardPayload]);

  const isSearchPending = query.trim() !== debouncedQuery;

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
      weekly_hours:
        formateur.weekly_hours
        || formateur.weekly_hours_target
        || formateur.hours?.weekly_hours?.target
        || '',
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
        weekly_hours:
          formValues.weekly_hours === '' || safeNumber(formValues.weekly_hours, 0) <= 0
            ? null
            : safeNumber(formValues.weekly_hours, 0),
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
      await Promise.all([
        refreshInsights(),
        refreshTable(formValues.id ? currentPage : 1, debouncedQuery),
      ]);
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
      await Promise.all([refreshInsights(), refreshTable(currentPage, debouncedQuery)]);
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

  const loadTrainerPreferences = async (formateurId, options = {}) => {
    const { silent = false } = options;

    try {
      if (!silent) {
        setPreferenceLoadingId(formateurId);
      }

      const payload = await FormateurService.getModulePreferencesByTrainer(formateurId);
      setPreferencePayloads((current) => ({
        ...current,
        [formateurId]: payload || null,
      }));
    } catch (loadError) {
      if (!silent) {
        pushToast({
          tone: 'danger',
          title: 'Preferences indisponibles',
          description: loadError.message || 'Impossible de charger les preferences modules.',
        });
      }
    } finally {
      if (!silent) {
        setPreferenceLoadingId((current) => (current === formateurId ? null : current));
      }
    }
  };

  const togglePreferenceCard = async (formateurId) => {
    if (expandedTrainerId === formateurId) {
      setExpandedTrainerId(null);
      return;
    }

    setExpandedTrainerId(formateurId);

    if (!preferencePayloads[formateurId]) {
      await loadTrainerPreferences(formateurId);
    }
  };

  const handlePreferenceMessageChange = (formateurId, value) => {
    setPreferenceMessages((current) => ({
      ...current,
      [formateurId]: value,
    }));
  };

  const handlePreferenceDecisionChange = (formateurId, decision) => {
    setPreferenceDecisions((current) => ({
      ...current,
      [formateurId]: current[formateurId] === decision ? '' : decision,
    }));
  };

  const handlePreferenceSubmit = async (formateur) => {
    const decision = preferenceDecisions[formateur.id] || '';
    const message = (preferenceMessages[formateur.id] || '').trim();

    if (!decision) {
      pushToast({
        tone: 'danger',
        title: 'Decision requise',
        description: 'Selectionnez accepter ou rejeter avant d envoyer.',
      });
      return;
    }

    try {
      setPreferenceSavingId(formateur.id);
      const payload = await FormateurService.respondModulePreferences(formateur.id, {
        status: decision,
        message,
      });

      setPreferencePayloads((current) => ({
        ...current,
        [formateur.id]: payload || null,
      }));
      setPreferenceMessages((current) => ({
        ...current,
        [formateur.id]: '',
      }));
      setPreferenceDecisions((current) => ({
        ...current,
        [formateur.id]: '',
      }));

      pushToast({
        tone: 'success',
        title: 'Preferences traitees',
        description: `${formateur.nom} a ete notifie avec succes.`,
      });
    } catch (saveError) {
      pushToast({
        tone: 'danger',
        title: 'Envoi impossible',
        description: saveError.message || 'La reponse du chef n a pas pu etre envoyee.',
      });
    } finally {
      setPreferenceSavingId(null);
    }
  };

  const handleSearchChange = (value) => {
    setQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefSection
        title="Gestion des Formateurs"
        subtitle="Catalogue premium avec recherche debouncee, pagination serveur et suivi instantane de la charge pedagogique."
        action={
          <ChefButton icon={Plus} onClick={openCreateModal}>
            Ajouter Formateur
          </ChefButton>
        }
        className="overflow-hidden"
      >
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <ChefSearchInput
              value={query}
              onChange={handleSearchChange}
              placeholder="Rechercher par nom, email ou specialite..."
              className="h-16 rounded-3xl border-[color-mix(in_srgb,var(--color-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-strong)_78%,transparent)] backdrop-blur-xl"
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-2 backdrop-blur">
                <Users className="h-4 w-4 text-[var(--color-primary)]" />
                {isSearchPending
                  ? 'Recherche en cours...'
                  : `${totalItems} formateur${totalItems > 1 ? 's' : ''}`}
              </span>
              <span className="rounded-2xl border border-[var(--color-border)] px-4 py-2 backdrop-blur">
                {`5 items / page`}
              </span>
              <span className="rounded-2xl border border-[var(--color-border)] px-4 py-2 backdrop-blur">
                {`Page ${currentPage} sur ${totalPages}`}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Formateurs"
              value={totalItems}
              helper="Pagination serveur active"
              loading={insightsLoading && !dashboardPayload}
            />
            <SummaryCard
              label="Heures cumulees"
              value={formatHours(totals.annual)}
              helper={`Hebdo valide ${formatHours(totals.weekly)}`}
              loading={insightsLoading && !dashboardPayload}
            />
            <SummaryCard
              label="Alertes"
              value={totals.alerts}
              helper="Surveillance centralisee"
              loading={insightsLoading && !dashboardPayload}
            />
          </div>
        </div>
      </ChefSection>

      <div className="space-y-4">
        <PremiumTable
          minWidthClassName="min-w-[1120px]"
          columns={[
            { key: 'nom', label: 'Nom', className: 'w-[22%]' },
            { key: 'specialite', label: 'Specialite', className: 'w-[12%]' },
            { key: 'modules', label: 'Modules', className: 'w-[14%]' },
            { key: 'contact', label: 'Contact', className: 'w-[15%]' },
            { key: 'charge', label: 'Charge', className: 'w-[16%]' },
            { key: 'score', label: 'Score', className: 'w-[10%]' },
            { key: 'statut', label: 'Statut', className: 'w-[6%]' },
            { key: 'actions', label: 'Actions', className: 'w-[9%] text-right' },
          ]}
          footer={(
            <PremiumTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemCount={formateurs.length}
              loading={tableLoading || isSearchPending}
              onPageChange={setCurrentPage}
              pendingLabel="Synchronisation de la recherche..."
            />
          )}
        >
          {tableLoading ? (
            <FormateursTableSkeleton />
          ) : formateurs.length ? (
            <motion.tbody
              layout
              variants={tableBodyVariants}
              initial="hidden"
              animate="show"
            >
              {formateurs.map((formateur) => {
                const stats = trainerStatsMap[safeNumber(formateur.id)] || {};
                const status = buildStatusBadge(formateur, stats, alertsByTrainer);
                const annualRatio =
                  safeNumber(formateur.max_heures) > 0
                    ? safeNumber(stats.annual_hours) / safeNumber(formateur.max_heures)
                    : 0;
                const assignedModules = stats.assigned_modules || [];
                const scorePresentation = getScorePresentation(
                  stats.questionnaire_percentage ?? formateur.questionnaire_percentage,
                );
                const isExpanded = expandedTrainerId === formateur.id;
                const preferencePayload = preferencePayloads[formateur.id] || null;
                const isPreferenceLoading = preferenceLoadingId === formateur.id;
                const isPreferenceSaving = preferenceSavingId === formateur.id;
                const trainerLoadSummary = `Hebdo actuel ${formatHours(stats.current_week_hours)} · Cible ${formatHours(formateur.weekly_hours || formateur.hours?.weekly_hours?.target || 0)} · Max ${formatHours(stats.max_week_hours)}`;
                const trainerPhone = typeof formateur.telephone === 'string'
                  ? formateur.telephone.trim()
                  : '';

                return (
                  <React.Fragment key={formateur.id}>
                    <motion.tr
                      layout
                      variants={tableRowVariants}
                      onClick={() => togglePreferenceCard(formateur.id)}
                      className={cn(
                      'cursor-pointer border-t border-[var(--color-border)] align-top transition hover-row',
                        isExpanded
                          ? 'bg-[color-mix(in_srgb,var(--color-primary-soft)_50%,transparent)]'
                          : 'hover:bg-[color-mix(in_srgb,var(--color-hover)_85%,transparent)]',
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex w-full items-start gap-3 text-left">
                          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] text-[var(--color-primary)] shadow-[0_12px_30px_var(--color-shadow)] backdrop-blur">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                          <Avatar name={formateur.nom} size={40} className="mt-1" />
                          <HoverDetailsCard
                            title="Formateur"
                            lines={[formateur.nom, trainerLoadSummary]}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-base font-semibold text-[var(--color-text-soft)] transition-colors duration-200 group-hover/hovercard:text-[var(--color-primary)]">
                                {formateur.nom}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">
                                {trainerLoadSummary}
                              </span>
                            </span>
                          </HoverDetailsCard>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                        <p className="line-clamp-2">{formateur.specialite || 'Non renseignee'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {assignedModules.length ? (
                            assignedModules.map((module) => (
                              <ChefBadge key={`${formateur.id}-${module.id}`} tone="blue" tooltip={module.intitule || module.code}>
                                {module.code}
                              </ChefBadge>
                            ))
                          ) : (
                            <span className="text-sm text-[var(--color-text-subtle)]">Aucun module</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                        <HoverDetailsCard
                          title="Contact"
                          lines={[trainerPhone, formateur.email]}
                        >
                          <div className="space-y-1">
                            {trainerPhone ? (
                              <p className="flex items-center gap-2 truncate">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-subtle)]" />
                                <span className="truncate">{trainerPhone}</span>
                              </p>
                            ) : null}
                            <p className="mt-1 flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-subtle)]" />
                              <span className="truncate">{formateur.email}</span>
                            </p>
                          </div>
                        </HoverDetailsCard>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-3">
                          <p className="text-lg font-semibold text-[var(--color-text-soft)]">
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
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {`S1 ${formatHours(stats.s1_hours)} · S2 ${formatHours(stats.s2_hours)}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {scorePresentation.percentage === null ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[var(--color-text-muted)]">Non evalue</p>
                            <p className="text-xs text-[var(--color-text-subtle)]">
                              Aucun questionnaire soumis
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-lg font-semibold text-[var(--color-text-soft)]">
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
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <ChefBadge tone={status.tone}>{status.label}</ChefBadge>
                          {(alertsByTrainer[safeNumber(formateur.id)] || []).length ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-danger-text)]">
                              <TriangleAlert className="h-4 w-4" />
                              {(alertsByTrainer[safeNumber(formateur.id)] || []).length} alerte(s)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(formateur);
                            }}
                            className="hover-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] text-[var(--color-text-soft)] shadow-[0_12px_24px_var(--color-shadow)] backdrop-blur active:scale-95"
                            data-tooltip="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={{ scale: deletingId === formateur.id ? 1 : 0.95 }}
                            disabled={deletingId === formateur.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(formateur);
                            }}
                            className="hover-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-danger-text)_30%,transparent)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] backdrop-blur active:scale-95 disabled:opacity-60"
                            data-tooltip="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <tr className="border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary-soft)_45%,transparent)]">
                          <td colSpan={8} className="px-4 py-5">
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                              {isPreferenceLoading && !preferencePayload ? (
                                <div className="rounded-3xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] px-5 py-10 text-center text-sm font-semibold text-[var(--color-text-muted)] backdrop-blur-xl">
                                  Chargement des preferences modules...
                                </div>
                              ) : (
                                <FormateurPreferenceReviewCard
                                  payload={preferencePayload}
                                  message={preferenceMessages[formateur.id] || ''}
                                  decision={preferenceDecisions[formateur.id] || ''}
                                  saving={isPreferenceSaving}
                                  onMessageChange={(value) => handlePreferenceMessageChange(formateur.id, value)}
                                  onDecisionChange={(value) => handlePreferenceDecisionChange(formateur.id, value)}
                                  onSubmit={() => handlePreferenceSubmit(formateur)}
                                />
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      ) : null}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </motion.tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={8} className="p-6">
                  <ChefEmptyState
                    title="Aucun formateur"
                    description="Ajustez votre recherche ou ajoutez un formateur pour commencer les affectations et le suivi de charge."
                  />
                </td>
              </tr>
            </tbody>
          )}
        </PremiumTable>
      </div>

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
          <ChefField label="Heures" help="Saisissez le volume d heures du formateur.">
            <ChefInput
              type="number"
              min="0"
              max="44"
              step="0.5"
              value={formValues.weekly_hours}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  weekly_hours: event.target.value,
                }))
              }
              placeholder="Ex. 20"
            />
          </ChefField>
          <ChefField label="Limite annuelle (h / an)" help="Maximum d heures autorisees sur toute l annee.">
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
              placeholder="Ex. 910"
            />
          </ChefField>
          {!formValues.id ? (
            <ChefField label="Mot de passe" help="Optionnel si le backend gere deja la creation securisee.">
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
        {formError ? <p className="mt-4 text-sm font-semibold text-[var(--color-danger-text)]">{formError}</p> : null}
      </ChefModal>
    </div>
  );
}
