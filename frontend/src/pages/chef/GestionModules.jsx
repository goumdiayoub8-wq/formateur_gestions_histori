import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleService from '../../services/moduleService';
import { buildModuleCode, formatHours, parseBooleanLike, safeNumber } from '../../utils/chefDashboard';
import {
  ChefBadge,
  ChefButton,
  ChefCheckbox,
  ChefEmptyState,
  ChefField,
  ChefInput,
  ChefModal,
  ChefPillTabs,
  ChefSearchInput,
  ChefSection,
  ChefSelect,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';
import { Skeleton } from '../../components/ui/Skeleton';
import { PremiumTable, PremiumTableFooter } from '../../components/ui/PremiumTable';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const EMPTY_MODULE = {
  id: null,
  code: '',
  intitule: '',
  filiere: '',
  semestre: 'S1',
  volume_horaire: 30,
  has_efm: false,
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

function MetricCard({ label, value, helper = '' }) {
  return (
    <div className="hover-card rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-5 shadow-sm dark:backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[var(--color-text-soft)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{helper}</p>
    </div>
  );
}

function ModulesTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`modules-skeleton-${index}`} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-28 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-14 rounded-full" /></td>
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

export default function GestionModules() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modules, setModules] = useState([]);
  const [query, setQuery] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');
  const [activeSemestre, setActiveSemestre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_MODULE);
  const [formError, setFormError] = useState('');
  const { toasts, pushToast, dismissToast } = useChefToasts();
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const debouncedFiliere = useDebouncedValue(filiereFilter.trim(), 300);

  const isSearchPending = query.trim() !== debouncedQuery || filiereFilter.trim() !== debouncedFiliere;

  const loadModules = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await ModuleService.listPaginated({
        page,
        limit: PAGE_LIMIT,
        search: debouncedQuery,
        filiere: debouncedFiliere || undefined,
        semestre: activeSemestre === 'all' ? undefined : activeSemestre,
      });

      setModules(Array.isArray(response?.data) ? response.data : []);
      setTotalItems(safeNumber(response?.total_items, 0));
      setTotalPages(Math.max(1, safeNumber(response?.total_pages, 1)));
      setCurrentPage(Math.max(1, safeNumber(response?.current_page, 1)));
    } catch (loadError) {
      pushToast({
        tone: 'danger',
        title: 'Chargement impossible',
        description: loadError.message || 'Impossible de charger les modules.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules(currentPage);
  }, [currentPage, debouncedQuery, debouncedFiliere, activeSemestre]);

  const totalHours = useMemo(
    () => modules.reduce((sum, module) => sum + safeNumber(module.volume_horaire), 0),
    [modules],
  );

  const efmCount = useMemo(
    () => modules.filter((module) => parseBooleanLike(module.has_efm)).length,
    [modules],
  );

  const openCreateModal = () => {
    setFormError('');
    setFormValues(EMPTY_MODULE);
    setModalOpen(true);
  };

  const openEditModal = (module) => {
    setFormError('');
    setFormValues({
      id: module.id,
      code: module.code || '',
      intitule: module.intitule || '',
      filiere: module.filiere || '',
      semestre: module.semestre || 'S1',
      volume_horaire: safeNumber(module.volume_horaire, 30),
      has_efm: parseBooleanLike(module.has_efm),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFormError('');

      const payload = {
        code: formValues.code.trim() || null,
        intitule: formValues.intitule.trim(),
        filiere: formValues.filiere.trim(),
        semestre: formValues.semestre,
        volume_horaire: safeNumber(formValues.volume_horaire),
        has_efm: Boolean(formValues.has_efm),
      };

      if (formValues.id) {
        await ModuleService.update(formValues.id, payload);
        pushToast({
          tone: 'success',
          title: 'Module mis a jour',
          description: `${payload.intitule} a ete modifie.`,
        });
      } else {
        await ModuleService.create(payload);
        pushToast({
          tone: 'success',
          title: 'Module ajoute',
          description: `${payload.intitule} est pret pour l affectation.`,
        });
      }

      setModalOpen(false);
      await loadModules(formValues.id ? currentPage : 1);
    } catch (saveError) {
      setFormError(saveError.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (module) => {
    if (!window.confirm(`Supprimer le module "${module.intitule}" ?`)) {
      return;
    }

    try {
      setDeletingId(module.id);
      await ModuleService.remove(module.id);
      pushToast({
        tone: 'success',
        title: 'Module supprime',
        description: `${module.intitule} a ete retire du catalogue.`,
      });
      await loadModules(currentPage);
    } catch (deleteError) {
      pushToast({
        tone: 'danger',
        title: 'Suppression impossible',
        description: deleteError.message || 'Le module n a pas pu etre supprime.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefSection
        title="Gestion des Modules"
        subtitle="Catalogue premium, filtres rapides et pagination serveur uniforme pour piloter le referentiel pedagogique."
        action={
          <div className="flex flex-wrap gap-3">
            <ChefButton icon={Plus} onClick={openCreateModal}>
              Ajouter Module
            </ChefButton>
            <ChefButton icon={Sparkles} variant="secondary" onClick={() => navigate('/chef/affectations')}>
              Assigner Module
            </ChefButton>
          </div>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <ChefSearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher un module, une filiere ou un code..."
              className="h-16 rounded-3xl border-[color-mix(in_srgb,var(--color-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-strong)_78%,transparent)] backdrop-blur-xl"
            />
            <ChefInput
              value={filiereFilter}
              onChange={(event) => {
                setFiliereFilter(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrer par filiere"
              className="h-16 rounded-3xl"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Modules" value={totalItems} helper="Pagination serveur active" />
            <MetricCard label="Volume visible" value={formatHours(totalHours)} helper={`Page ${currentPage}/${totalPages}`} />
            <MetricCard label="EFM visibles" value={efmCount} helper="Filtre instantane" />
          </div>
        </div>
      </ChefSection>

      <ChefPillTabs
        active={activeSemestre}
        onChange={(value) => {
          setActiveSemestre(value);
          setCurrentPage(1);
        }}
        items={[
          { value: 'all', label: 'S1 + S2' },
          { value: 'S1', label: 'Semestre S1' },
          { value: 'S2', label: 'Semestre S2' },
        ]}
      />

      <PremiumTable
        minWidthClassName="min-w-[980px]"
        columns={[
          { key: 'code', label: 'Code', className: 'w-[14%]' },
          { key: 'nom', label: 'Nom du module', className: 'w-[32%]' },
          { key: 'filiere', label: 'Filiere', className: 'w-[20%]' },
          { key: 'heures', label: 'Heures', className: 'w-[12%]' },
          { key: 'semestre', label: 'Semestre', className: 'w-[10%]' },
          { key: 'actions', label: 'Actions', className: 'w-[12%] text-right' },
        ]}
        footer={(
          <PremiumTableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemCount={modules.length}
            loading={loading || isSearchPending}
            onPageChange={setCurrentPage}
            pendingLabel="Recherche des modules..."
          />
        )}
      >
        {loading ? (
          <ModulesTableSkeleton />
        ) : modules.length ? (
          <motion.tbody layout variants={tableBodyVariants} initial="hidden" animate="show">
            {modules.map((module) => (
              <motion.tr
                key={module.id}
                layout
                variants={tableRowVariants}
                className="hover-row border-t border-[var(--color-border)] transition hover:bg-[color-mix(in_srgb,var(--color-hover)_85%,transparent)]"
              >
                <td className="px-4 py-5">
                  <span className="text-2xl font-semibold text-[var(--color-text-soft)]" data-tooltip={module.intitule}>
                    {buildModuleCode(module)}
                  </span>
                </td>
                <td className="px-4 py-5">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-text-soft)]">{module.intitule}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parseBooleanLike(module.has_efm) ? (
                        <ChefBadge tone="orange" tooltip="Examen de Fin de Module">EFM</ChefBadge>
                      ) : null}
                      {(module.groupes || []).map((groupe) => (
                        <ChefBadge key={`${module.id}-${groupe}`} tone="blue">
                          {groupe}
                        </ChefBadge>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <ChefBadge tone="violet">{module.filiere}</ChefBadge>
                </td>
                <td className="px-4 py-5 text-lg font-semibold text-[var(--color-text-soft)]">
                  {formatHours(module.volume_horaire)}
                </td>
                <td className="px-4 py-5">
                  <ChefBadge tone="green">{module.semestre}</ChefBadge>
                </td>
                <td className="px-4 py-5">
                  <div className="flex justify-end gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(module)}
                      className="hover-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_74%,transparent)] text-[var(--color-text-soft)] shadow-[0_12px_24px_var(--color-shadow)] backdrop-blur"
                      data-tooltip="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: deletingId === module.id ? 1 : 0.95 }}
                      disabled={deletingId === module.id}
                      onClick={() => handleDelete(module)}
                      className="hover-icon-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-danger-text)_30%,transparent)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] backdrop-blur disabled:opacity-60"
                      data-tooltip="Supprimer"
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
                  title="Aucun module"
                  description="Aucun module ne correspond aux filtres actifs. Essayez une autre recherche ou creez un nouveau module."
                />
              </td>
            </tr>
          </tbody>
        )}
      </PremiumTable>

      <ChefModal
        open={modalOpen}
        title={formValues.id ? 'Modifier le module' : 'Ajouter un module'}
        subtitle="Le formulaire reste strictement aligne sur les champs traites par l API backend."
        onClose={() => setModalOpen(false)}
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <ChefButton variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </ChefButton>
            <ChefButton onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : formValues.id ? 'Mettre a jour' : 'Creer'}
            </ChefButton>
          </div>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ChefField label="Code">
            <ChefInput
              value={formValues.code}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="M101"
            />
          </ChefField>
          <ChefField label="Intitule">
            <ChefInput
              value={formValues.intitule}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, intitule: event.target.value }))
              }
              placeholder="Programmation web"
            />
          </ChefField>
          <ChefField label="Filiere">
            <ChefInput
              value={formValues.filiere}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, filiere: event.target.value }))
              }
              placeholder="Developpement digital"
            />
          </ChefField>
          <ChefField label="Semestre">
            <ChefSelect
              value={formValues.semestre}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, semestre: event.target.value }))
              }
            >
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </ChefSelect>
          </ChefField>
          <ChefField label="Volume horaire">
            <ChefInput
              type="number"
              min="1"
              value={formValues.volume_horaire}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  volume_horaire: event.target.value,
                }))
              }
            />
          </ChefField>
          <div className="flex items-end">
            <ChefCheckbox
              checked={Boolean(formValues.has_efm)}
              onChange={(checked) =>
                setFormValues((current) => ({ ...current, has_efm: checked }))
              }
              label="Module avec EFM"
            />
          </div>
        </div>
        {formError ? <p className="mt-4 text-sm font-semibold text-[var(--color-danger-text)]">{formError}</p> : null}
      </ChefModal>
    </div>
  );
}
