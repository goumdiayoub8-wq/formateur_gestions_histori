import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { ChefBadge, ChefButton, ChefEmptyState, ChefProgress } from './ChefUI';

function preferenceTone(status) {
  if (status === 'accepted') {
    return 'green';
  }

  if (status === 'rejected') {
    return 'red';
  }

  return 'orange';
}

function preferenceLabel(status) {
  if (status === 'accepted') {
    return 'Accepte';
  }

  if (status === 'rejected') {
    return 'Rejete';
  }

  return 'En attente';
}

export default function FormateurPreferenceReviewCard({
  payload,
  message,
  decision,
  saving = false,
  onMessageChange,
  onDecisionChange,
  onSubmit,
}) {
  const preferences = Array.isArray(payload?.preferences) ? payload.preferences : [];
  const pendingPreferences = Array.isArray(payload?.pending_preferences) ? payload.pending_preferences : [];
  const summary = payload?.summary || {};

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_14px_34px_var(--color-shadow)]">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">En attente</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{summary.pending || 0}</p>
            </div>
            <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Acceptes</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{summary.accepted || 0}</p>
            </div>
            <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Rejetes</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{summary.rejected || 0}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {preferences.length ? (
              preferences.map((preference) => (
                <div
                  key={`${preference.formateur_id}-${preference.module_id}`}
                  className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text)]">
                        {preference.module_code} · {preference.module_title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {preference.filiere} · {preference.semestre} · {preference.volume_horaire}h
                      </p>
                    </div>
                    <ChefBadge tone={preferenceTone(preference.status)}>
                      {preferenceLabel(preference.status)}
                    </ChefBadge>
                  </div>
                  {preference.message_chef ? (
                    <div className="mt-3 rounded-[16px] bg-[var(--color-card-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                      {preference.message_chef}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <ChefEmptyState
                title="Aucune preference module"
                description="Ce formateur n'a pas encore soumis de preferences."
              />
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--color-text)]">Decision du chef</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                La decision s'applique aux preferences actuellement en attente.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <ChefProgress
              value={pendingPreferences.length}
              max={Math.max(preferences.length, 1)}
              tone="orange"
              label="Preferences a traiter"
              rightLabel={`${pendingPreferences.length} / ${preferences.length}`}
            />

            <div className="flex flex-wrap gap-2">
              <ChefButton
                variant={decision === 'accepted' ? 'primary' : 'ghost'}
                onClick={() => onDecisionChange('accepted')}
                disabled={saving || pendingPreferences.length === 0}
              >
                Accepter
              </ChefButton>
              <ChefButton
                variant={decision === 'rejected' ? 'danger' : 'ghost'}
                onClick={() => onDecisionChange('rejected')}
                disabled={saving || pendingPreferences.length === 0}
              >
                Rejeter
              </ChefButton>
            </div>

            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              rows={5}
              placeholder="Ajouter un message visible par le formateur..."
              className="theme-input theme-focus-ring w-full rounded-[18px] border px-4 py-4 text-sm outline-none"
            />

            <ChefButton
              onClick={onSubmit}
              disabled={saving || pendingPreferences.length === 0 || !decision}
              className="w-full"
            >
              {saving ? 'Envoi...' : 'Envoyer'}
            </ChefButton>
          </div>
        </div>
      </div>
    </div>
  );
}
