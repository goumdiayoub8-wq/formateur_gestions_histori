import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ModuleService from '../../services/moduleService';
import DirectorSurface from '../../components/director/DirectorSurface';

export default function ProgressionModulesDirecteur() {
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const filters = {
          q: searchParams.get('q') || undefined,
          module_id: searchParams.get('module_id') || undefined,
          groupe_id: searchParams.get('groupe_id') || undefined,
        };

        const [summaryPayload, rowsPayload] = await Promise.all([
          ModuleService.getProgressSummary(),
          ModuleService.getProgressList(filters),
        ]);

        if (active) {
          setSummary(summaryPayload);
          setRows(rowsPayload);
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

    load();
    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#17233a]">Progression des Modules</h1>
        <p className="mt-2 text-[18px] text-[#6d7b92]">Suivi de l'avancement des modules d'enseignement</p>
      </div>

      {error ? <div className="rounded-[20px] border border-[#ffd9d9] bg-[#fff5f5] px-5 py-4 text-[#d14343]">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-4">
        <DirectorSurface className="px-6 py-5">
          <p className="text-[15px] text-[#6d7b92]">Total Modules</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#17233a]">{summary?.total_modules ?? 0}</p>
        </DirectorSurface>
        <DirectorSurface className="px-6 py-5">
          <p className="text-[15px] text-[#6d7b92]">Total Hours</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#9323ff]">{summary?.total_hours ?? 0}</p>
        </DirectorSurface>
        <DirectorSurface className="px-6 py-5">
          <p className="text-[15px] text-[#6d7b92]">Semester 1</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#2563ff]">{summary?.semester_1 ?? 0}</p>
        </DirectorSurface>
        <DirectorSurface className="px-6 py-5">
          <p className="text-[15px] text-[#6d7b92]">Semester 2</p>
          <p className="mt-2 text-[46px] font-semibold leading-none text-[#e91e86]">{summary?.semester_2 ?? 0}</p>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-7">
        <h2 className="text-[18px] font-semibold text-[#17233a]">Progression visuelle</h2>
        {loading ? (
          <div className="py-12 text-center text-[#64748b]">Chargement des modules...</div>
        ) : (
          <div className="mt-8 space-y-7">
            {rows.map((row) => (
              <div key={row.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1a2741]">{row.code} - {row.intitule}</h3>
                    <p className="mt-1 text-[14px] uppercase tracking-[0.02em] text-[#7b879b]">
                      {row.groupes.join(' • ')} • {row.formateur_nom}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[18px] font-semibold text-[#17233a]">{row.progress_percent}%</p>
                    <p className="text-sm text-[#7b879b]">{row.completed_hours}h / {row.volume_horaire}h</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#cfd2d8]">
                  <div
                    className="h-full rounded-full bg-[#040419]"
                    style={{ width: `${Math.max(0, Math.min(row.progress_percent, 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </DirectorSurface>
    </div>
  );
}
