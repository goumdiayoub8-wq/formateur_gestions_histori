import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Eye, FileClock, ShieldCheck, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PlanningService from '../../services/planningService';
import { PremiumCard, PremiumMetricCard } from '../../components/ui/PremiumCard';
import { PremiumTable, PremiumTableFooter } from '../../components/ui/PremiumTable';
import { Skeleton, SkeletonPremiumCard } from '../../components/ui/Skeleton';
import DirectorStatusPill from '../../components/director/DirectorStatusPill';

const PAGE_LIMIT = 5;

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hoursProgress(annualHours, annualTarget = 910) {
  const safeTarget = Number(annualTarget) > 0 ? Number(annualTarget) : 910;
  return Math.max(0, Math.min((Number(annualHours || 0) / safeTarget) * 100, 100));
}

function QueueTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4"><Skeleton className="h-4 w-36" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-4"><Skeleton className="h-10 w-32 rounded-2xl" /></td>
        </tr>
      ))}
    </tbody>
  );
}

function HistoryListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-3 w-36" />
          <Skeleton className="mt-4 h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DetailModalSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonPremiumCard key={`detail-metric-${index}`} />
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`detail-row-${index}`} className="grid gap-3 border-b border-[var(--color-border)] py-3 last:border-b-0 md:grid-cols-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ValidationPlanningDirecteur() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [summary, setSummary] = useState(null);
  const [queueRows, setQueueRows] = useState([]);
  const [queuePage, setQueuePage] = useState(1);
  const [queueTotalItems, setQueueTotalItems] = useState(0);
  const [queueTotalPages, setQueueTotalPages] = useState(1);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    setQueuePage(1);
  }, [query]);

  const loadSummary = async () => {
    const payload = await PlanningService.getValidationSummary();
    setSummary(payload);
  };

  const loadQueue = async (page = queuePage) => {
    setLoading(true);
    try {
      const payload = await PlanningService.getValidationQueuePage({
        page,
        limit: PAGE_LIMIT,
        ...(query ? { q: query } : {}),
      });
      setQueueRows(Array.isArray(payload?.data) ? payload.data : []);
      setQueueTotalItems(Number(payload?.total_items || 0));
      setQueueTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
      setQueuePage(Math.max(1, Number(payload?.current_page || page)));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (page = historyPage) => {
    setHistoryLoading(true);
    try {
      const payload = await PlanningService.getValidationHistoryPage({
        page,
        limit: PAGE_LIMIT,
      });
      setHistoryRows(Array.isArray(payload?.data) ? payload.data : []);
      setHistoryTotalItems(Number(payload?.total_items || 0));
      setHistoryTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
      setHistoryPage(Math.max(1, Number(payload?.current_page || page)));
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshValidationCenter = async ({ queueTargetPage = queuePage, historyTargetPage = historyPage } = {}) => {
    setError('');
    try {
      await Promise.all([
        loadSummary(),
        loadQueue(queueTargetPage),
        loadHistory(historyTargetPage),
      ]);
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger les validations.');
    }
  };

  useEffect(() => {
    setError('');
    loadSummary().catch((loadError) => {
      setError(loadError?.message || 'Impossible de charger les validations.');
    });
  }, []);

  useEffect(() => {
    setError('');
    loadQueue(queuePage).catch((loadError) => {
      setError(loadError?.message || 'Impossible de charger les validations.');
    });
  }, [queuePage, query]);

  useEffect(() => {
    setError('');
    loadHistory(historyPage).catch((loadError) => {
      setError(loadError?.message || 'Impossible de charger les validations.');
    });
  }, [historyPage]);

  const pendingIds = useMemo(
    () => queueRows.filter((row) => row.status === 'pending' || row.status === 'revision').map((row) => row.id),
    [queueRows],
  );
  const submission = detail?.submission || null;

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(`${status}-${id}`);
    setError('');
    try {
      await PlanningService.updateValidationStatus(id, status);
      await refreshValidationCenter();
    } catch (updateError) {
      setError(updateError?.message || 'Mise a jour impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const handleBulkUpdate = async (status) => {
    if (pendingIds.length === 0) {
      return;
    }

    setActionLoading(`bulk-${status}`);
    setError('');
    try {
      await PlanningService.bulkUpdateValidationStatus(pendingIds, status);
      await refreshValidationCenter();
    } catch (updateError) {
      setError(updateError?.message || 'Mise a jour impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    setError('');
    try {
      const payload = await PlanningService.getValidationDetail(id);
      setDetail(payload);
    } catch (detailError) {
      setError(detailError?.message || 'Impossible de charger le detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const queueColumns = [
    { key: 'formateur', label: 'Formateur', className: 'w-[18%]' },
    { key: 'specialite', label: 'Specialite', className: 'w-[15%]' },
    { key: 'modules', label: 'Modules', className: 'w-[20%]' },
    { key: 'contact', label: 'Contact', className: 'w-[16%]' },
    { key: 'charge', label: 'Charge', className: 'w-[16%]' },
    { key: 'actions', label: 'Actions', className: 'w-[15%]' },
  ];

  return (
    <div className="space-y-6">
      <PremiumCard className="overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-sky-900 dark:text-white dark:shadow-none" hover={false}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
              Centre de validation
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Validation des plannings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
                Traitement pagine de la file de validation pour garder des temps de reponse stables, meme avec de gros volumes.
              </p>
            </div>
            {query ? <p className="text-sm font-semibold text-sky-700 dark:text-sky-100">Filtre actif: {query}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pendingIds.length === 0 || actionLoading === 'bulk-rejected'}
              onClick={() => handleBulkUpdate('rejected')}
              className="hover-action inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15"
            >
              Tout refuser
            </button>
            <button
              type="button"
              disabled={pendingIds.length === 0 || actionLoading === 'bulk-approved'}
              onClick={() => handleBulkUpdate('approved')}
              className="hover-action inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:brightness-105 dark:shadow-none disabled:opacity-40"
            >
              Tout valider
            </button>
          </div>
        </div>
      </PremiumCard>

      {error ? (
        <PremiumCard className="border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-5 text-[var(--color-danger-text)]" hover={false}>
          {error}
        </PremiumCard>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summary === null ? (
          <>
            <SkeletonPremiumCard />
            <SkeletonPremiumCard />
            <SkeletonPremiumCard />
            <SkeletonPremiumCard />
          </>
        ) : (
          <>
            <PremiumMetricCard icon={FileClock} label="En attente" value={summary?.pending_count ?? 0} meta="Soumissions a traiter" tone="amber" />
            <PremiumMetricCard icon={ShieldCheck} label="Valides cette semaine" value={summary?.approved_this_week ?? 0} meta="Validation reussie" tone="brand" />
            <PremiumMetricCard icon={X} label="Refuses cette semaine" value={summary?.rejected_this_week ?? 0} meta="Demandes renvoyees" tone="rose" />
            <PremiumMetricCard icon={Eye} label="Charge critique" value={summary?.overload_count ?? 0} meta="Au-dessus du seuil" tone="default" />
          </>
        )}
      </div>

      <div className="space-y-6">
        <PremiumCard className="mb-1" hover={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Historique recent</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">Dernieres decisions</h2>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
              {historyTotalItems} total
            </div>
          </div>

          <div className="mt-6">
            {historyLoading ? (
              <HistoryListSkeleton />
            ) : (
              <div className="space-y-3">
                {historyRows.map((item) => (
                  <div key={item.id} className="hover-card rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-soft)]">{item.formateur_nom}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">{formatDateTime(item.processed_at)}</p>
                      </div>
                      <DirectorStatusPill status={item.status} />
                    </div>
                    <p className="mt-3 text-sm text-[var(--color-text-muted)]">{item.submitted_hours}h soumises</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <PremiumTableFooter
            currentPage={historyPage}
            totalPages={historyTotalPages}
            totalItems={historyTotalItems}
            itemCount={historyRows.length}
            loading={historyLoading}
            onPageChange={(page) => {
              setHistoryPage(page);
            }}
            pendingLabel="Chargement de l historique..."
          />
        </PremiumCard>

        <PremiumTable
          columns={queueColumns}
          minWidthClassName="min-w-[1120px]"
          footer={
            <PremiumTableFooter
              currentPage={queuePage}
              totalPages={queueTotalPages}
              totalItems={queueTotalItems}
              itemCount={queueRows.length}
              loading={loading}
              onPageChange={(page) => {
                setQueuePage(page);
              }}
              pendingLabel="Chargement de la file de validation..."
            />
          }
        >
          {loading ? (
            <QueueTableSkeleton />
          ) : (
            <tbody>
              {queueRows.map((row) => {
                const annualTarget = Number(row.max_heures || 910);
                const progress = hoursProgress(row.annual_hours, annualTarget);
                const actionKeyApprove = `approved-${row.id}`;
                const actionKeyReject = `rejected-${row.id}`;

                return (
                  <tr key={row.id} className="hover-row border-t border-[var(--color-border)] align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--color-text-soft)]">{row.formateur_nom}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Semaine {row.semaine}</div>
                    </td>
                    <td className="px-4 py-4 text-[var(--color-text-muted)]">{row.specialite || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {row.module_codes.map((code) => (
                          <span key={`${row.id}-${code}`} className="hover-badge rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                      <div>{row.telephone || '-'}</div>
                      <div className="mt-1">{row.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-[var(--color-text-soft)]">{row.annual_hours}h / {annualTarget}h</div>
                      <div className="mt-3 h-2.5 rounded-full bg-slate-200 transition-colors duration-300 dark:bg-white/10">
                        <div
                          className={progress > 90 ? 'h-2.5 rounded-full bg-rose-500' : 'h-2.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700'}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-3">
                        <DirectorStatusPill status={row.status} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(row.id)}
                          className="hover-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-soft)]"
                          data-tooltip="Voir le detail"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === actionKeyApprove}
                          onClick={() => handleStatusUpdate(row.id, 'approved')}
                          className="hover-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-sm transition duration-300 dark:shadow-none disabled:opacity-40"
                          data-tooltip="Valider"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === actionKeyReject}
                          onClick={() => handleStatusUpdate(row.id, 'rejected')}
                          className="hover-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-danger-text)] disabled:opacity-40"
                          data-tooltip="Refuser"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </PremiumTable>
      </div>

      {(detail || detailLoading) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4">
          <div className="theme-card w-full max-w-4xl rounded-3xl border p-6 shadow-[0_24px_70px_var(--color-shadow-strong)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text-soft)]">
                  {detailLoading ? 'Chargement...' : submission?.formateur_nom}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">Detail de la soumission hebdomadaire</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-[var(--color-text-muted)]">
                <X className="h-6 w-6" />
              </button>
            </div>

            {detailLoading ? (
              <DetailModalSkeleton />
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <PremiumMetricCard icon={FileClock} label="Semaine" value={submission?.semaine ?? '-'} meta="Soumission courante" tone="default" />
                  <PremiumMetricCard icon={Clock3} label="Heures soumises" value={`${submission?.submitted_hours ?? 0}h`} meta="Charge declaree" tone="brand" />
                  <PremiumMetricCard icon={ShieldCheck} label="Statut" value={submission?.status || '-'} meta={submission?.decision_note || 'Sans note'} tone="amber" />
                </div>

                <PremiumTable
                  columns={[
                    { key: 'module', label: 'Module', className: 'w-[36%]' },
                    { key: 'filiere', label: 'Filiere', className: 'w-[24%]' },
                    { key: 'semestre', label: 'Semestre', className: 'w-[18%]' },
                    { key: 'heures', label: 'Heures', className: 'w-[22%]' },
                  ]}
                  minWidthClassName="min-w-[760px]"
                >
                  <tbody>
                    {(detail?.entries || []).map((entry) => (
                      <tr key={entry.id} className="border-t border-[var(--color-border)] text-sm">
                        <td className="px-4 py-4 text-[var(--color-text-soft)]">{entry.module_code} - {entry.module_intitule}</td>
                        <td className="px-4 py-4 text-[var(--color-text-muted)]">{entry.filiere}</td>
                        <td className="px-4 py-4 text-[var(--color-text-muted)]">{entry.semestre}</td>
                        <td className="px-4 py-4 font-semibold text-[var(--color-text-soft)]">{entry.heures}h</td>
                      </tr>
                    ))}
                  </tbody>
                </PremiumTable>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
