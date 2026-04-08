import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FormateurEmptyBlock, FormateurPanel, FormateurSectionHeader } from './FormateurUI';

function statusBadge(status) {
  if (status === 'accepted') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200';
  }

  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200';
  }

  if (status === 'pending') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200';
  }

  return 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300';
}

function statusLabel(status) {
  if (status === 'accepted') {
    return 'Accepte';
  }

  if (status === 'rejected') {
    return 'Rejete';
  }

  if (status === 'pending') {
    return 'En attente';
  }

  return 'Disponible';
}

export default function ModulePreferenceSection({
  payload,
  selectedModuleIds,
  onToggle,
  onSubmit,
  submitting = false,
  hasDraft = false,
  error = '',
}) {
  const [selectedOption, setSelectedOption] = useState('');
  const modules = Array.isArray(payload?.modules) ? payload.modules : [];
  const summary = payload?.summary || {};
  const selectedOrReviewedModules = useMemo(
    () =>
      modules.filter((module) => {
        const checked = selectedModuleIds.includes(module.module_id);
        const hasWorkflowState = module.status && module.status !== 'available';
        return checked || hasWorkflowState || Boolean(module.message_chef);
      }),
    [modules, selectedModuleIds],
  );
  const selectableModules = useMemo(
    () =>
      modules.filter((module) => {
        if (module.locked) {
          return false;
        }

        return !selectedModuleIds.includes(module.module_id);
      }),
    [modules, selectedModuleIds],
  );

  const handleSelectModule = (event) => {
    const value = Number(event.target.value || 0);
    setSelectedOption('');

    if (!value || selectedModuleIds.includes(value)) {
      return;
    }

    onToggle(value);
  };

  return (
    <FormateurPanel className="p-6">
      <FormateurSectionHeader
        title="Preferences de modules"
        description="Selectionnez les modules que vous souhaitez enseigner. Les reponses du chef de pole apparaissent ici automatiquement."
        action={(
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !hasDraft}
            className="inline-flex items-center justify-center rounded-[16px] bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
          >
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        )}
      />

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="theme-card-muted theme-border rounded-[18px] border px-4 py-4">
          <p className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.12em]">Selectionnes</p>
          <p className="theme-text-primary mt-2 text-[22px] font-bold">{selectedModuleIds.length}</p>
        </div>
        <div className="theme-card-muted theme-border rounded-[18px] border px-4 py-4">
          <p className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.12em]">En attente</p>
          <p className="theme-text-primary mt-2 text-[22px] font-bold">{summary.pending || 0}</p>
        </div>
        <div className="theme-card-muted theme-border rounded-[18px] border px-4 py-4">
          <p className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.12em]">Acceptes</p>
          <p className="theme-text-primary mt-2 text-[22px] font-bold">{summary.accepted || 0}</p>
        </div>
        <div className="theme-card-muted theme-border rounded-[18px] border px-4 py-4">
          <p className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.12em]">Rejetes</p>
          <p className="theme-text-primary mt-2 text-[22px] font-bold">{summary.rejected || 0}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {error ? (
          <div className="theme-status-danger rounded-[20px] border px-5 py-4 text-[14px] font-medium">
            {error}
          </div>
        ) : null}

        {modules.length ? (
          <div className="theme-card rounded-[24px] border p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
              <div>
                <p className="theme-text-primary text-[15px] font-bold">Module concerne</p>
                <p className="theme-text-muted mt-1 text-[14px]">
                  Choisissez un module depuis la barre puis envoyez vos preferences.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-[var(--color-surface-strong)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border)]">
                {selectedModuleIds.length} module{selectedModuleIds.length > 1 ? 's' : ''} selectionne{selectedModuleIds.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="mt-5">
              <label className="block">
                <span className="theme-text-primary mb-2 block text-[14px] font-semibold">Module concerne</span>
                <div className="relative">
                  <select
                    value={selectedOption}
                    onChange={handleSelectModule}
                    disabled={submitting || !selectableModules.length}
                    className="theme-input theme-focus-ring h-12 w-full appearance-none rounded-[18px] border px-4 pr-12 text-[15px] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Selectionnez un module</option>
                    {selectableModules.map((module) => (
                      <option key={module.module_id} value={module.module_id}>
                        {module.module_code} · {module.module_title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="theme-text-subtle pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                </div>
              </label>
            </div>

            <div className="mt-5 grid gap-3">
              {selectedOrReviewedModules.length ? selectedOrReviewedModules.map((module) => {
                const checked = selectedModuleIds.includes(module.module_id);
                const disabled = module.locked || submitting;

                return (
                  <label
                    key={module.module_id}
                    className={`block rounded-[20px] border bg-[var(--color-surface-strong)] px-4 py-4 transition ${
                      checked
                        ? 'border-blue-500 shadow-[0_12px_28px_rgba(31,87,255,0.10)] dark:border-blue-400 dark:shadow-none'
                        : 'border-[var(--color-border)]'
                    } ${disabled ? 'opacity-90' : 'cursor-pointer hover:border-[var(--color-border-strong)]'}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(module.module_id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 dark:border-slate-600"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="theme-text-primary text-[15px] font-bold">
                              {module.module_code} · {module.module_title}
                            </p>
                            <div className="theme-text-muted mt-2 flex flex-wrap gap-2 text-[13px]">
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{module.filiere}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{module.semestre}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{module.volume_horaire}h</span>
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadge(module.status)}`}>
                            {statusLabel(module.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                          <span className={checked ? 'font-semibold text-blue-600 dark:text-blue-200' : 'theme-text-muted'}>
                            {checked ? 'Module coche' : 'Module non coche'}
                          </span>
                          {module.locked ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                              Choix verrouille
                            </span>
                          ) : null}
                        </div>

                        {module.message_chef ? (
                          <p className="mt-3 rounded-[16px] bg-slate-50 px-4 py-3 text-[14px] leading-6 text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border)] dark:bg-white/5">
                            {module.message_chef}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </label>
                );
              }) : (
                <div className="theme-card-muted rounded-[18px] border border-dashed border-[var(--color-border)] px-4 py-5 text-[14px] text-[var(--color-text-muted)]">
                  Aucun module selectionne pour le moment. Utilisez la barre ci-dessus pour ajouter vos choix.
                </div>
              )}
            </div>
          </div>
        ) : (
          <FormateurEmptyBlock
            title="Aucun module disponible"
            description="Les modules eligibles apparaitront ici des qu ils seront disponibles dans le catalogue."
          />
        )}
      </div>
    </FormateurPanel>
  );
}
