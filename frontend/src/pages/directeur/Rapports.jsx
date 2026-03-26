import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import ReportService from '../../services/reportService';
import DirectorSurface from '../../components/director/DirectorSurface';

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function reportFilename(report) {
  const safeTitle = report.title.toLowerCase().replace(/\s+/g, '-');
  const extension = report.file_path?.split('.').pop() || (report.format === 'pdf' ? 'pdf' : 'xls');
  return `${safeTitle}.${extension}`;
}

function ReportActionButton({ loading, onClick, icon: Icon, children, variant = 'primary' }) {
  const classes =
    variant === 'primary'
      ? 'director-report-action director-report-action--primary bg-[#10a63c] text-white'
      : 'director-report-action director-report-action--secondary border border-[#dce4ef] bg-white text-[#1d2432]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={[
        'inline-flex flex-1 items-center justify-center gap-3 rounded-[14px] px-5 py-4 text-[16px] font-medium transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)] disabled:cursor-not-allowed disabled:opacity-60',
        classes,
      ].join(' ')}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

export default function Rapports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await ReportService.getRecent();
      setReports(rows);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async (type, format) => {
    const key = `${type}-${format}`;
    setActionLoading(key);
    setError('');
    try {
      const report =
        type === 'workload'
          ? await ReportService.generateWorkload(format)
          : await ReportService.generateModuleProgress(format);
      const blob = await ReportService.download(report.id);
      saveBlob(blob, reportFilename(report));
      await load();
    } catch (generateError) {
      setError(generateError.message || 'Génération du rapport impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDownload = async (report) => {
    setActionLoading(`download-${report.id}`);
    try {
      const blob = await ReportService.download(report.id);
      saveBlob(blob, reportFilename(report));
    } catch (downloadError) {
      setError(downloadError.message || 'Téléchargement impossible.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#17233a]">Génération de Rapports</h1>
        <p className="mt-2 text-[18px] text-[#6d7b92]">Exportez des rapports détaillés en PDF ou Excel</p>
      </div>

      {error ? <div className="rounded-[20px] border border-[#ffd9d9] bg-[#fff5f5] px-5 py-4 text-[#d14343]">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e8f1ff] text-[#3274ff]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Rapport charge enseignants</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Vue détaillée de la charge de travail de tous les formateurs</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton loading={actionLoading === 'workload-pdf'} onClick={() => handleGenerate('workload', 'pdf')} icon={Download}>
              Export PDF
            </ReportActionButton>
            <ReportActionButton loading={actionLoading === 'workload-xlsx'} onClick={() => handleGenerate('workload', 'xlsx')} icon={Download} variant="secondary">
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f3e9ff] text-[#ad37ff]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Rapport progression modules</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">État d'avancement de tous les modules par filière</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton loading={actionLoading === 'module-progress-pdf'} onClick={() => handleGenerate('module-progress', 'pdf')} icon={Download}>
              Export PDF
            </ReportActionButton>
            <ReportActionButton loading={actionLoading === 'module-progress-xlsx'} onClick={() => handleGenerate('module-progress', 'xlsx')} icon={Download} variant="secondary">
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-6">
        <h2 className="text-[18px] font-semibold text-[#17233a]">Rapports récents</h2>
        {loading ? (
          <div className="py-10 text-center text-[#64748b]">Chargement des rapports...</div>
        ) : (
          <div className="mt-6 space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#dde4ef] px-4 py-4">
                <div>
                  <p className="text-[16px] font-semibold text-[#17233a]">{report.title}</p>
                  <p className="mt-1 text-sm text-[#7a869b]">
                    Généré le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(report)}
                  disabled={actionLoading === `download-${report.id}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dce4ef] bg-white text-[#1c2432] disabled:opacity-60"
                >
                  {actionLoading === `download-${report.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </DirectorSurface>
    </div>
  );
}
