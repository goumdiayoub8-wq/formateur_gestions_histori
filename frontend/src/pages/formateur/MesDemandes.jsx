import React, { useEffect, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import { FormateurEmptyBlock, FormateurPanel, FormateurSectionHeader, FormateurStatCard } from '../../components/formateur/FormateurUI';

function statusClasses(status) {
  if (status === 'planned') {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200';
  }

  if (status === 'validated' || status === 'approved') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200';
  }

  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200';
  }

  return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function MesDemandes() {
  const [overview, setOverview] = useState(null);
  const [formData, setFormData] = useState({
    module_id: '',
    groupe_code: '',
    semaine: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await FormateurService.getDemandesOverview();
      setOverview(response);
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await FormateurService.createDemande(formData);
      setSuccess('Votre demande de modification a bien ete envoyee.');
      setFormData({
        module_id: '',
        groupe_code: '',
        semaine: '',
        reason: '',
      });
      await loadOverview();
    } catch (saveError) {
      setError(saveError?.message || "Impossible d'envoyer la demande.");
    } finally {
      setSaving(false);
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
        <h1 className="theme-text-primary text-[22px] font-bold tracking-tight">Demande de Modification</h1>
        <p className="theme-text-muted mt-2 text-[15px]">Demandez une modification de votre planning</p>
      </div>

      {error ? (
        <FormateurPanel className="theme-status-danger px-6 py-5 text-[15px] font-semibold">{error}</FormateurPanel>
      ) : null}

      {success ? (
        <FormateurPanel className="theme-status-success px-6 py-5 text-[15px] font-semibold">
          {success}
        </FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <FormateurStatCard
          className="hover-card"
          icon={() => null}
          iconClassName="hidden"
          label="Demandes ce mois"
          value={overview?.summary?.total_this_month || 0}
        />
        <FormateurStatCard
          className="hover-card"
          icon={() => null}
          iconClassName="hidden"
          label="Approuvees"
          value={overview?.summary?.approved_count || 0}
        />
        <FormateurStatCard
          className="hover-card"
          icon={() => null}
          iconClassName="hidden"
          label="En attente"
          value={overview?.summary?.pending_count || 0}
        />
      </div>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Nouvelle demande" />
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="theme-text-primary mb-2 block text-[15px] font-medium">Module concerne</span>
            <select
              value={formData.module_id}
              onChange={handleChange('module_id')}
              className="theme-input theme-focus-ring h-12 w-full rounded-[16px] border px-4 text-[14px] outline-none"
            >
              <option value="">Selectionnez un module</option>
              {(overview?.modules || []).map((module) => (
                <option key={module.id} value={module.id}>
                  {module.code} - {module.intitule}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="theme-text-primary mb-2 block text-[15px] font-medium">Groupe</span>
            <input
              value={formData.groupe_code}
              onChange={handleChange('groupe_code')}
              placeholder="Ex: S13"
              className="theme-input theme-focus-ring h-12 w-full rounded-[16px] border px-4 text-[14px] outline-none"
            />
          </label>

          <label className="block">
            <span className="theme-text-primary mb-2 block text-[15px] font-medium">Semaine</span>
            <input
              value={formData.semaine}
              onChange={handleChange('semaine')}
              placeholder="Ex: Semaine S13"
              className="theme-input theme-focus-ring h-12 w-full rounded-[16px] border px-4 text-[14px] outline-none"
            />
          </label>

          <label className="block">
            <span className="theme-text-primary mb-2 block text-[15px] font-medium">Raison de la modification</span>
            <textarea
              rows={4}
              value={formData.reason}
              onChange={handleChange('reason')}
              placeholder="Expliquez la raison de votre demande..."
              className="theme-input theme-focus-ring w-full rounded-[16px] border px-4 py-3 text-[14px] outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !formData.module_id || !formData.reason}
            className="hover-action inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-500 to-fuchsia-600 text-[15px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-none"
          >
            <SendHorizontal className="h-4 w-4" />
            {saving ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </FormateurPanel>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Historique des demandes" />
        <div className="mt-6 space-y-4">
          {overview?.history?.length ? (
            overview.history.map((item) => (
              <div key={item.id} className="hover-row flex flex-col gap-4 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="theme-text-primary text-[16px] font-bold">
                    {item.module_code} - {item.module_intitule}
                  </p>
                  <p className="theme-text-muted mt-1 text-[14px]">
                    {formatDate(item.created_at)} • {item.semaine}
                  </p>
                  <p className="theme-text-primary mt-3 text-[15px]">{item.reason}</p>
                </div>
                <span
                  className={`hover-badge inline-flex shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${statusClasses(item.status)}`}
                  data-tooltip={item.status === 'planned' ? 'Planifiée pour arbitrage' : (item.status === 'validated' || item.status === 'approved' ? 'Demande acceptée' : (item.status === 'rejected' ? 'Demande refusée' : 'En attente de revue'))}
                >
                  {item.status === 'planned'
                    ? 'Planifie'
                    : item.status === 'validated' || item.status === 'approved'
                      ? 'Valide'
                      : item.status === 'rejected'
                        ? 'Refuse'
                        : 'En attente'}
                </span>
              </div>
            ))
          ) : (
            <FormateurEmptyBlock
              title="Aucune demande enregistree"
              description="Les demandes envoye es apparaitront ici avec leur statut."
            />
          )}
        </div>
      </FormateurPanel>
    </div>
  );
}
