import React, { useEffect, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import { FormateurEmptyBlock, FormateurPanel, FormateurSectionHeader, FormateurStatCard } from '../../components/formateur/FormateurUI';

function statusClasses(status) {
  if (status === 'approved') {
    return 'bg-[#e8f9ea] text-[#18a34a]';
  }

  if (status === 'rejected') {
    return 'bg-[#fff1f1] text-[#d14343]';
  }

  return 'bg-[#fff4e9] text-[#ff6f1f]';
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
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] bg-[#f7f9fd] px-6 py-7">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1f2a3d]">Demande de Modification</h1>
        <p className="mt-2 text-[15px] text-[#75859c]">Demandez une modification de votre planning</p>
      </div>

      {error ? (
        <FormateurPanel className="px-6 py-5 text-[15px] font-semibold text-[#b54545]">{error}</FormateurPanel>
      ) : null}

      {success ? (
        <FormateurPanel className="border-[#bfe8cb] bg-[#effcf3] px-6 py-5 text-[15px] font-semibold text-[#1b7b48]">
          {success}
        </FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <FormateurStatCard
          icon={() => null}
          iconClassName="hidden"
          label="Demandes ce mois"
          value={overview?.summary?.total_this_month || 0}
        />
        <FormateurStatCard
          icon={() => null}
          iconClassName="hidden"
          label="Approuvees"
          value={overview?.summary?.approved_count || 0}
        />
        <FormateurStatCard
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
            <span className="mb-2 block text-[15px] font-medium text-[#334761]">Module concerne</span>
            <select
              value={formData.module_id}
              onChange={handleChange('module_id')}
              className="h-12 w-full rounded-[16px] border border-[#e7ecf5] bg-[#f7f9fd] px-4 text-[14px] text-[#223046] outline-none"
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
            <span className="mb-2 block text-[15px] font-medium text-[#334761]">Groupe</span>
            <input
              value={formData.groupe_code}
              onChange={handleChange('groupe_code')}
              placeholder="Ex: S13"
              className="h-12 w-full rounded-[16px] border border-[#e7ecf5] bg-[#f7f9fd] px-4 text-[14px] text-[#223046] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium text-[#334761]">Semaine</span>
            <input
              value={formData.semaine}
              onChange={handleChange('semaine')}
              placeholder="Ex: Semaine S13"
              className="h-12 w-full rounded-[16px] border border-[#e7ecf5] bg-[#f7f9fd] px-4 text-[14px] text-[#223046] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[15px] font-medium text-[#334761]">Raison de la modification</span>
            <textarea
              rows={4}
              value={formData.reason}
              onChange={handleChange('reason')}
              placeholder="Expliquez la raison de votre demande..."
              className="w-full rounded-[16px] border border-[#e7ecf5] bg-[#f7f9fd] px-4 py-3 text-[14px] text-[#223046] outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !formData.module_id || !formData.groupe_code || !formData.semaine || !formData.reason}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#b55af2] to-[#ac56f1] text-[15px] font-semibold text-white shadow-[0_18px_32px_rgba(176,89,242,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div key={item.id} className="flex flex-col gap-4 rounded-[20px] border border-[#edf1f6] bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-[#1d2a3f]">
                    {item.module_code} - {item.module_intitule}
                  </p>
                  <p className="mt-1 text-[14px] text-[#73839c]">
                    {formatDate(item.created_at)} • {item.semaine}
                  </p>
                  <p className="mt-3 text-[15px] text-[#334761]">{item.reason}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${statusClasses(item.status)}`}>
                  {item.status === 'approved' ? 'Approuve' : item.status === 'rejected' ? 'Refuse' : 'En attente'}
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
