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
  const safeTitle = String(report.title || `rapport-${report.id || 'export'}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `rapport-${report.id || 'export'}`;
  const extension = report.file_path?.split('.').pop() || (report.format === 'pdf' ? 'pdf' : 'xls');
  return `${safeTitle}.${extension}`;
}

function isPdfDependencyError(message) {
  return typeof message === 'string' && message.toLowerCase().includes('generation pdf indisponible');
}

function groupReportsByType(reports) {
  const grouped = new Map();

  reports.forEach((report) => {
    const key = report.type || report.title || `report-${report.id}`;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        key,
        title: report.title || report.type || `Rapport #${report.id}`,
        created_at: report.created_at,
        formats: {
          [report.format]: report,
        },
      });
      return;
    }

    current.formats[report.format] = report;

    if (new Date(report.created_at).getTime() > new Date(current.created_at).getTime()) {
      current.created_at = report.created_at;
    }
  });

  return Array.from(grouped.values()).sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
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

  const visibleReportTypes = [
    'module_progress',
    'validation_status',
    'global_platform_summary',
    'hours_by_department',
    'top_trainers',
    'module_success_rates',
  ];

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
      let report;

      switch (type) {
        case 'module-progress':
          report = await ReportService.generateModuleProgress(format);
          break;
        case 'validation-status':
          report = await ReportService.generateValidationStatus(format);
          break;
        case 'global-platform-summary':
          report = await ReportService.generateGlobalPlatformSummary(format);
          break;
        case 'hours-by-department':
          report = await ReportService.generateHoursByDepartment(format);
          break;
        case 'top-trainers':
          report = await ReportService.generateTopTrainers(format);
          break;
        case 'module-success-rates':
          report = await ReportService.generateModuleSuccessRates(format);
          break;
        default:
          throw new Error('Type de rapport non pris en charge.');
      }

      const blob = await ReportService.download(report.id);
      saveBlob(blob, reportFilename(report));
      await load();
    } catch (generateError) {
      setError(generateError.message || 'Génération du rapport impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const visibleReports = groupReportsByType(
    reports.filter((report) => visibleReportTypes.includes(report.type)),
  );

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

      <div className="rounded-[20px] border border-[#dce4ef] bg-[#f8fbff] px-5 py-4 text-[#4f6078]">
        Les exports PDF et Excel sont disponibles pour les rapports de direction pédagogique.
      </div>

      {error ? <div className="rounded-[20px] border border-[#ffd9d9] bg-[#fff5f5] px-5 py-4 text-[#d14343]">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
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
            <ReportActionButton
              loading={actionLoading === 'module-progress-pdf'}
              onClick={() => handleGenerate('module-progress', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'module-progress-xlsx'}
              onClick={() => handleGenerate('module-progress', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
          {isPdfDependencyError(error) ? (
            <p className="mt-4 text-sm text-[#8a5a00]">
              Le backend a bien répondu. Pour activer le PDF, il faut installer `backend/vendor` via Composer.
            </p>
          ) : null}
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e8f1ff] text-[#3274ff]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Rapport validation planning</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Suivi des soumissions, statuts et notes de validation pédagogique</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={actionLoading === 'validation-status-pdf'}
              onClick={() => handleGenerate('validation-status', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'validation-status-xlsx'}
              onClick={() => handleGenerate('validation-status', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef3ff] text-[#315cf0]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Synthèse globale plateforme</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Vue consolidée des KPIs, validations, filières et top formateurs</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={actionLoading === 'global-platform-summary-pdf'}
              onClick={() => handleGenerate('global-platform-summary', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'global-platform-summary-xlsx'}
              onClick={() => handleGenerate('global-platform-summary', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#edfdf2] text-[#16a34a]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Heures par filière</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Analyse des volumes planifiés et réalisés par département pédagogique</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={actionLoading === 'hours-by-department-pdf'}
              onClick={() => handleGenerate('hours-by-department', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'hours-by-department-xlsx'}
              onClick={() => handleGenerate('hours-by-department', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff6ea] text-[#f59e0b]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Top formateurs</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Classement des formateurs selon l exécution réelle et les questionnaires</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={actionLoading === 'top-trainers-pdf'}
              onClick={() => handleGenerate('top-trainers', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'top-trainers-xlsx'}
              onClick={() => handleGenerate('top-trainers', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff0f6] text-[#db2777]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-[#17233a]">Taux de réussite modules</h2>
              <p className="mt-2 text-[16px] text-[#6d7b92]">Taux de completion et réussite des modules pour arbitrage direction</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={actionLoading === 'module-success-rates-pdf'}
              onClick={() => handleGenerate('module-success-rates', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={actionLoading === 'module-success-rates-xlsx'}
              onClick={() => handleGenerate('module-success-rates', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>
      </div>

      <DirectorSurface className="p-6">
        <h2 className="text-[18px] font-semibold text-[#17233a]">Rapports récents</h2>
        {loading ? (
          <div className="py-10 text-center text-[#64748b]">Chargement des rapports...</div>
        ) : visibleReports.length === 0 ? (
          <div className="py-10 text-center text-[#64748b]">Aucun rapport généré pour le moment.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {visibleReports.map((reportGroup) => (
              <div key={reportGroup.key} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#dde4ef] px-4 py-4">
                <div>
                  <p className="text-[16px] font-semibold text-[#17233a]">{reportGroup.title}</p>
                  <p className="mt-1 text-sm text-[#7a869b]">
                    Généré le {new Date(reportGroup.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {reportGroup.formats.pdf ? (
                    <>
                      <span className="report-format-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                        PDF
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(reportGroup.formats.pdf)}
                        disabled={actionLoading === `download-${reportGroup.formats.pdf.id}`}
                        className="report-download-button inline-flex h-11 w-11 items-center justify-center rounded-[14px] border disabled:opacity-60"
                      >
                        {actionLoading === `download-${reportGroup.formats.pdf.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      </button>
                    </>
                  ) : null}
                  {reportGroup.formats.xlsx ? (
                    <>
                      <span className="report-format-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                        Excel
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(reportGroup.formats.xlsx)}
                        disabled={actionLoading === `download-${reportGroup.formats.xlsx.id}`}
                        className="report-download-button inline-flex h-11 w-11 items-center justify-center rounded-[14px] border disabled:opacity-60"
                      >
                        {actionLoading === `download-${reportGroup.formats.xlsx.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </DirectorSurface>
    </div>
  );
}
