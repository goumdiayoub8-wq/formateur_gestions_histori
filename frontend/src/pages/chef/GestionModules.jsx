import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleService from '../../services/moduleService';
import {
  buildFiliereSummaries,
  buildModuleCode,
  formatHours,
  parseBooleanLike,
  safeNumber,
} from '../../utils/chefDashboard';
import {
  ChefBadge,
  ChefButton,
  ChefCheckbox,
  ChefEmptyState,
  ChefField,
  ChefInput,
  ChefLoadingState,
  ChefModal,
  ChefPillTabs,
  ChefSearchInput,
  ChefSection,
  ChefSelect,
  ChefTableShell,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';

const EMPTY_MODULE = {
  id: null,
  code: '',
  intitule: '',
  filiere: '',
  semestre: 'S1',
  volume_horaire: 30,
  has_efm: false,
};

export default function GestionModules() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modules, setModules] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFiliere, setActiveFiliere] = useState('all');
  const [activeSemestre, setActiveSemestre] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_MODULE);
  const [formError, setFormError] = useState('');
  const { toasts, pushToast, dismissToast } = useChefToasts();

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await ModuleService.list();
      setModules(Array.isArray(response) ? response : []);
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
    loadModules();
  }, []);

  const filiereSummaries = useMemo(
    () => buildFiliereSummaries(modules),
    [modules],
  );

  const filteredModules = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return modules.filter((module) => {
      const matchesQuery =
        !normalized ||
        [module.code, module.intitule, module.filiere, module.semestre]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      const matchesFiliere =
        activeFiliere === 'all' || module.filiere === activeFiliere;
      const matchesSemestre =
        activeSemestre === 'all' || module.semestre === activeSemestre;

      return matchesQuery && matchesFiliere && matchesSemestre;
    });
  }, [activeFiliere, activeSemestre, modules, query]);

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
      await loadModules();
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
      await loadModules();
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

  if (loading) {
    return <ChefLoadingState label="Chargement des modules..." />;
  }

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefSection
        title="Gestion des Modules & Filieres"
        subtitle="Catalogue complet des modules, filtre par filiere / semestre et acces direct a l affectation intelligente."
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
        <div className="grid gap-4 xl:grid-cols-4">
          {filiereSummaries.length ? (
            filiereSummaries.map((summary) => (
              <button
                key={summary.id}
                type="button"
                onClick={() =>
                  setActiveFiliere((current) =>
                    current === summary.filiere ? 'all' : summary.filiere,
                  )
                }
                className="rounded-[26px] border border-[#dce6f3] bg-white px-6 py-6 text-left shadow-[0_16px_34px_rgba(39,74,129,0.08)] transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-bold text-white ${summary.badge}`}>
                    {summary.shortLabel}
                  </div>
                  <ChefBadge tone={activeFiliere === summary.filiere ? 'blue' : 'slate'}>
                    {summary.moduleCount} modules
                  </ChefBadge>
                </div>
                <h3 className="mt-5 text-2xl font-bold text-[#1b2941]">{summary.filiere}</h3>
                <p className="mt-2 text-sm text-[#7b8ea8]">{formatHours(summary.totalHours)} · {summary.efmCount} EFM</p>
              </button>
            ))
          ) : (
            <div className="xl:col-span-4">
              <ChefEmptyState
                title="Aucune filiere disponible"
                description="Creez vos premiers modules pour voir apparaitre les filieres."
              />
            </div>
          )}
        </div>
      </ChefSection>

      <div className="space-y-4">
        <ChefSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un module, une filiere ou un semestre..."
        />

        <ChefPillTabs
          active={activeFiliere}
          onChange={setActiveFiliere}
          items={[
            { value: 'all', label: 'Tous les modules' },
            ...filiereSummaries.map((summary) => ({
              value: summary.filiere,
              label: summary.filiere,
            })),
          ]}
        />

        <ChefPillTabs
          active={activeSemestre}
          onChange={setActiveSemestre}
          items={[
            { value: 'all', label: 'S1 + S2' },
            { value: 'S1', label: 'Semestre S1' },
            { value: 'S2', label: 'Semestre S2' },
          ]}
        />
      </div>

      <ChefTableShell>
        {filteredModules.length ? (
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-[linear-gradient(90deg,_#2f71f5_0%,_#a21caf_100%)] text-sm uppercase tracking-[0.14em] text-white">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Nom du module</th>
                <th className="px-6 py-4">Filiere</th>
                <th className="px-6 py-4">Heures</th>
                <th className="px-6 py-4">Semestre</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module) => (
                <tr key={module.id} className="border-t border-[#e9eef7]">
                  <td className="px-6 py-5 text-2xl font-semibold text-[#1b2941]">
                    {buildModuleCode(module)}
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-lg font-semibold text-[#1b2941]">{module.intitule}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {parseBooleanLike(module.has_efm) ? (
                          <ChefBadge tone="orange">EFM</ChefBadge>
                        ) : null}
                        {(module.groupes || []).map((groupe) => (
                          <ChefBadge key={`${module.id}-${groupe}`} tone="blue">
                            {groupe}
                          </ChefBadge>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <ChefBadge tone="violet">{module.filiere}</ChefBadge>
                  </td>
                  <td className="px-6 py-5 text-lg font-semibold text-[#4b5f7a]">
                    {formatHours(module.volume_horaire)}
                  </td>
                  <td className="px-6 py-5 text-lg text-[#4b5f7a]">{module.semestre}</td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(module)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dce5f1] bg-white text-[#445873]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === module.id}
                        onClick={() => handleDelete(module)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#ffd5d5] bg-[#fff5f5] text-[#cf4c4c] disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <ChefEmptyState
              title="Aucun module"
              description="Aucun module ne correspond aux filtres actifs. Essayez une autre filiere ou creez un nouveau module."
            />
          </div>
        )}
      </ChefTableShell>

      <ChefModal
        open={modalOpen}
        title={formValues.id ? 'Modifier le module' : 'Ajouter un module'}
        subtitle="Le formulaire reste strictement aligne sur les champs traites par l API backend."
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
        {formError ? <p className="mt-4 text-sm font-semibold text-[#cf4c4c]">{formError}</p> : null}
      </ChefModal>
    </div>
  );
}
