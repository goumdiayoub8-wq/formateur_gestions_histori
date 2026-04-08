import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ModuleService from '../../services/moduleService';
import DirectorSurface from '../../components/director/DirectorSurface';
import { PremiumTable, PremiumTableFooter } from '../../components/ui/PremiumTable';
import { Skeleton } from '../../components/ui/Skeleton';

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
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

function ProgressionTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <tr key={`progression-table-skeleton-${index}`} className="border-t border-[var(--color-border)]">
          <td className="px-4 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-44 rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-28 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
          <td className="px-4 py-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          </td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-20 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-4 w-32 rounded-full" /></td>
        </tr>
      ))}
    </tbody>
  );
}

function ProgressionVisualSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      {Array.from({ length: PAGE_LIMIT }, (_, index) => (
        <div key={`progression-visual-skeleton-${index}`} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-5 shadow-sm dark:backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-52 rounded-full" />
              <Skeleton className="h-4 w-40 rounded-full" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-5 h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ProgressionModulesDirecteur() {
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const query = searchParams.get('q') || undefined;
  const moduleId = searchParams.get('module_id') || undefined;
  const groupeId = searchParams.get('groupe_id') || undefined;

  const filters = useMemo(
    () => ({
      q: query,
      module_id: moduleId,
      groupe_id: groupeId,
    }),
    [groupeId, moduleId, query],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [groupeId, moduleId, query]);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const summaryPayload = await ModuleService.getProgressSummary();
        if (active) {
          setSummary(summaryPayload);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Impossible de charger la progression des modules.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setTableLoading(true);
      setError('');
      try {
        const payload = await ModuleService.getProgressListPage({
          page: currentPage,
          limit: PAGE_LIMIT,
          ...filters,
        });

        if (active) {
          setRows(Array.isArray(payload?.data) ? payload.data : []);
          setTotalItems(Number(payload?.total_items || 0));
          setTotalPages(Math.max(1, Number(payload?.total_pages || 1)));
          setCurrentPage(Math.max(1, Number(payload?.current_page || currentPage)));
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Impossible de charger la progression des modules.');
        }
      } finally {
        if (active) {
          setTableLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, [currentPage, groupeId, moduleId, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--color-text-soft)]">Progression des Modules</h1>
        <p className="mt-2 text-[18px] text-[var(--color-text-muted)]">Vue paginee uniforme pour suivre l avancement pedagogique sans surcharger l ecran.</p>
      </div>

      {error ? <div className="rounded-[20px] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-5 py-4 text-[var(--color-danger-text)]">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-4">
        <DirectorSurface className="hover-card px-6 py-5">
          <span className="block text-[15px] text-[var(--color-text-muted)]">Total Modules</span>
          <div className="mt-2 text-[46px] font-semibold leading-none text-[var(--color-text-soft)]">
            {loading ? <Skeleton as="span" className="inline-block h-12 w-20 rounded-2xl align-middle" /> : summary?.total_modules ?? 0}
          </div>
        </DirectorSurface>
        <DirectorSurface className="hover-card px-6 py-5">
          <span className="block text-[15px] text-[var(--color-text-muted)]">Total Hours</span>
          <div className="mt-2 text-[46px] font-semibold leading-none text-sky-300">
            {loading ? <Skeleton as="span" className="inline-block h-12 w-24 rounded-2xl align-middle" /> : summary?.total_hours ?? 0}
          </div>
        </DirectorSurface>
        <DirectorSurface className="px-6 py-5">
          <span className="block text-[15px] text-[var(--color-text-muted)]">Semester 1</span>
          <div className="mt-2 text-[46px] font-semibold leading-none text-blue-300">
            {loading ? <Skeleton as="span" className="inline-block h-12 w-20 rounded-2xl align-middle" /> : summary?.semester_1 ?? 0}
          </div>
        </DirectorSurface>
        <DirectorSurface className="px-6 py-5">
          <span className="block text-[15px] text-[var(--color-text-muted)]">Semester 2</span>
          <div className="mt-2 text-[46px] font-semibold leading-none text-rose-300">
            {loading ? <Skeleton as="span" className="inline-block h-12 w-20 rounded-2xl align-middle" /> : summary?.semester_2 ?? 0}
          </div>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-0">
        <div className="px-7 py-6">
          <h2 className="text-[18px] font-semibold text-[var(--color-text-soft)]">Progression Modules</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Pagination serveur de 5 modules avec la meme experience que la gestion des formateurs.</p>
        </div>

        <PremiumTable
          minWidthClassName="min-w-[980px]"
          className="rounded-none border-x-0 border-b-0 border-t border-[var(--color-border)] bg-transparent shadow-none"
          columns={[
            { key: 'module', label: 'Module', className: 'w-[28%]' },
            { key: 'filiere', label: 'Filiere', className: 'w-[14%]' },
            { key: 'groupes', label: 'Groupes', className: 'w-[14%]' },
            { key: 'progression', label: 'Progression', className: 'w-[20%]' },
            { key: 'charge', label: 'Charge', className: 'w-[10%]' },
            { key: 'formateur', label: 'Formateur', className: 'w-[14%]' },
          ]}
          footer={(
            <PremiumTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemCount={rows.length}
              loading={tableLoading}
              onPageChange={setCurrentPage}
              pendingLabel="Chargement de la progression..."
            />
          )}
        >
          {tableLoading ? (
            <ProgressionTableSkeleton />
          ) : rows.length ? (
            <motion.tbody layout variants={tableBodyVariants} initial="hidden" animate="show">
              {rows.map((row) => (
                <motion.tr key={row.id} layout variants={tableRowVariants} className="hover-row border-t border-[var(--color-border)] text-[var(--color-text-soft)]">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="font-semibold" data-tooltip={row.intitule}>{row.code} - {row.intitule}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{row.semestre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{row.filiere}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(row.groupes || []).length ? row.groupes.map((groupe) => (
                        <span key={`${row.id}-${groupe}`} className="hover-badge rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)]">
                          {groupe}
                        </span>
                      )) : (
                        <span className="text-sm text-[var(--color-text-muted)]">Aucun groupe</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-[var(--color-text-soft)]">{row.progress_percent}%</span>
                        <span className="text-[var(--color-text-muted)]">{row.completed_hours}h / {row.volume_horaire}h</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(135deg,#38bdf8_0%,#2563eb_48%,#1d4ed8_100%)]"
                          style={{ width: `${Math.max(0, Math.min(Number(row.progress_percent || 0), 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{row.remaining_hours}h restantes</td>
                  <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{row.formateur_nom}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          ) : (
            <tbody>
              <tr className="border-t border-[var(--color-border)]">
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  Aucun module ne correspond aux filtres actuels.
                </td>
              </tr>
            </tbody>
          )}
        </PremiumTable>
      </DirectorSurface>

      <DirectorSurface className="p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--color-text-soft)]">Progression visuelle</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">La pagination serveur alimente aussi cette vue detaillee pour garder un chargement fluide.</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {totalItems} modules
          </div>
        </div>

        {tableLoading ? (
          <ProgressionVisualSkeleton />
        ) : rows.length ? (
          <motion.div
            layout
            initial="hidden"
            animate="show"
            variants={tableBodyVariants}
            className="mt-8 space-y-7"
          >
            {rows.map((row) => (
              <motion.div key={row.id} layout variants={tableRowVariants} className="hover-card rounded-[24px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[var(--color-text-soft)]">{row.code} - {row.intitule}</h3>
                    <p className="mt-1 text-[14px] uppercase tracking-[0.02em] text-[var(--color-text-muted)]">
                      {(row.groupes || []).join(' • ') || 'Aucun groupe'} • {row.formateur_nom}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[18px] font-semibold text-[var(--color-text-soft)]">{row.progress_percent}%</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{row.completed_hours}h / {row.volume_horaire}h</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,#38bdf8_0%,#2563eb_48%,#1d4ed8_100%)]"
                    style={{ width: `${Math.max(0, Math.min(Number(row.progress_percent || 0), 100))}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-strong)_72%,transparent)] px-6 py-12 text-center text-[var(--color-text-muted)]">
            Aucun module ne correspond aux filtres actifs sur cette page.
          </div>
        )}
      </DirectorSurface>
    </div>
  );
}
