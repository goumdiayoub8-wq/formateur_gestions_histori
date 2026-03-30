import React, { useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PlanningService from '../../services/planningService';
import DirectorSurface from '../../components/director/DirectorSurface';
import DirectorStatusPill from '../../components/director/DirectorStatusPill';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return date.toLocaleDateString('fr-FR', {
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

export default function ValidationPlanningDirecteur() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await PlanningService.getValidationDashboard(query ? { q: query } : {});
      setDashboard(payload);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les validations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  const rows = dashboard?.queue || [];
  const pendingIds = useMemo(() => rows.filter((row) => row.status === 'pending' || row.status === 'revision').map((row) => row.id), [rows]);
  const submission = detail?.submission || null;

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(`${status}-${id}`);
    try {
      await PlanningService.updateValidationStatus(id, status);
      await load();
    } catch (updateError) {
      setError(updateError.message || 'Mise à jour impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const handleBulkUpdate = async (status) => {
    if (pendingIds.length === 0) {
      return;
    }

    setActionLoading(`bulk-${status}`);
    try {
      await PlanningService.bulkUpdateValidationStatus(pendingIds, status);
      await load();
    } catch (updateError) {
      setError(updateError.message || 'Mise à jour impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    try {
      const payload = await PlanningService.getValidationDetail(id);
      setDetail(payload);
    } catch (detailError) {
      setError(detailError.message || 'Impossible de charger le détail.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#17233a]">Validation des Plannings</h1>
          <p className="mt-2 text-[18px] text-[#6d7b92]">
            {(dashboard?.summary?.pending_count ?? 0)} plannings en attente de validation
          </p>
          {query ? <p className="mt-2 text-sm text-[#3567ff]">Filtre actif : {query}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pendingIds.length === 0 || actionLoading === 'bulk-rejected'}
            onClick={() => handleBulkUpdate('rejected')}
            className="inline-flex items-center gap-3 rounded-[16px] border border-[#dde4ef] bg-white px-6 py-4 text-[18px] font-medium text-[#1c2230] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
            Tout refuser
          </button>
          <button
            type="button"
            disabled={pendingIds.length === 0 || actionLoading === 'bulk-approved'}
            onClick={() => handleBulkUpdate('approved')}
            className="inline-flex items-center gap-3 rounded-[16px] bg-[#10a63c] px-6 py-4 text-[18px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-5 w-5" />
            Tout valider
          </button>
        </div>
      </div>

      {error ? <div className="rounded-[20px] border border-[#ffd9d9] bg-[#fff5f5] px-5 py-4 text-[#d14343]">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <DirectorSurface className="px-5 py-4">
          <p className="text-[15px] text-[#66758f]">En attente</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#ff6b2e]">{dashboard?.summary?.pending_count ?? 0}</p>
        </DirectorSurface>
        <DirectorSurface className="px-5 py-4">
          <p className="text-[15px] text-[#66758f]">Validés cette semaine</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#19b44b]">{dashboard?.summary?.approved_this_week ?? 0}</p>
        </DirectorSurface>
        <DirectorSurface className="px-5 py-4">
          <p className="text-[15px] text-[#66758f]">Refusés cette semaine</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#ef4444]">{dashboard?.summary?.rejected_this_week ?? 0}</p>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-6">
        <h2 className="text-[18px] font-semibold text-[#17233a]">Historique des validations récentes</h2>
        <div className="mt-6 space-y-4">
          {(dashboard?.history || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#dde4ef] px-4 py-4">
              <div>
                <p className="text-[15px] font-semibold text-[#24334f]">{item.formateur_nom}</p>
                <p className="mt-1 text-sm text-[#7a869b]">{formatDateTime(item.processed_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[#d8dee9] px-3 py-1 text-sm text-[#3d485b]">{item.submitted_hours}h</span>
                <DirectorStatusPill status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </DirectorSurface>

      <DirectorSurface className="overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#64748b]">Chargement des soumissions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[linear-gradient(90deg,_#3d7df1_0%,_#2d67ea_100%)] text-left text-sm uppercase tracking-[0.08em] text-white">
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Spécialité</th>
                  <th className="px-6 py-4">Modules enseignés</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Charge annuelle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const annualTarget = Number(row.max_heures || 910);
                  const progress = hoursProgress(row.annual_hours, annualTarget);
                  const actionKeyApprove = `approved-${row.id}`;
                  const actionKeyReject = `rejected-${row.id}`;
                  return (
                    <tr key={row.id} className="border-b border-[#e7edf6]">
                      <td className="px-6 py-5 text-[15px] font-semibold text-[#17233a]">{row.formateur_nom}</td>
                      <td className="px-6 py-5 text-[15px] text-[#61718b]">{row.specialite}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {row.module_codes.map((code) => (
                            <span key={code} className="rounded-full bg-[#edf2ff] px-3 py-1 text-sm font-medium text-[#3567ff]">
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#61718b]">
                        <div>{row.telephone || '-'}</div>
                        <div>{row.email}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[15px] font-semibold text-[#17233a]">
                          {row.annual_hours}h / {annualTarget}h
                        </div>
                        <div className="mt-2 h-2.5 w-[130px] overflow-hidden rounded-full bg-[#e5e7eb]">
                          <div
                            className={progress > 90 ? 'h-full rounded-full bg-[#ef4444]' : 'h-full rounded-full bg-[#22c55e]'}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <DirectorStatusPill status={row.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(row.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#dce3ef] bg-white text-[#18243a]"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === actionKeyApprove}
                            onClick={() => handleStatusUpdate(row.id, 'approved')}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#12a83d] text-white disabled:opacity-50"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === actionKeyReject}
                            onClick={() => handleStatusUpdate(row.id, 'rejected')}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dce3ef] bg-white text-[#ff4b4b] disabled:opacity-50"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DirectorSurface>

      {(detail || detailLoading) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/35 px-4">
          <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-semibold text-[#17233a]">
                  {detailLoading ? 'Chargement...' : submission?.formateur_nom}
                </h3>
                <p className="mt-2 text-[#6d7b92]">Détail de la soumission hebdomadaire</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-[#6b7a92]">
                <X className="h-6 w-6" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-[#64748b]">Chargement du détail...</div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <DirectorSurface className="px-4 py-4">
                    <p className="text-sm text-[#6d7b92]">Semaine</p>
                    <p className="mt-2 text-2xl font-semibold text-[#17233a]">{submission?.semaine}</p>
                  </DirectorSurface>
                  <DirectorSurface className="px-4 py-4">
                    <p className="text-sm text-[#6d7b92]">Heures soumises</p>
                    <p className="mt-2 text-2xl font-semibold text-[#17233a]">{submission?.submitted_hours}h</p>
                  </DirectorSurface>
                  <DirectorSurface className="px-4 py-4">
                    <p className="text-sm text-[#6d7b92]">Statut</p>
                    <div className="mt-3">
                      <DirectorStatusPill status={submission?.status} />
                    </div>
                  </DirectorSurface>
                </div>

                <DirectorSurface className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm uppercase tracking-[0.08em] text-[#7d8798]">
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Filière</th>
                        <th className="px-4 py-3">Semestre</th>
                        <th className="px-4 py-3">Heures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail?.entries || []).map((entry) => (
                        <tr key={entry.id} className="border-t border-[#e8edf5]">
                          <td className="px-4 py-3">{entry.module_code} - {entry.module_intitule}</td>
                          <td className="px-4 py-3">{entry.filiere}</td>
                          <td className="px-4 py-3">{entry.semestre}</td>
                          <td className="px-4 py-3">{entry.heures}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DirectorSurface>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
