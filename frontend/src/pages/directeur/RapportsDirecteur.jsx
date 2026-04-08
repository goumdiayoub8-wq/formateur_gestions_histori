import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import ReportService from '../../services/reportService';
import DirectorSurface from '../../components/director/DirectorSurface';

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildReportFilename(report) {
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
      ? 'director-report-action director-report-action--primary border border-[rgb(6,95,70)] bg-[rgb(6,95,70)] text-white hover:bg-[rgb(4,120,87)] dark:border-[rgb(209,250,229)] dark:bg-[rgb(209,250,229)] dark:text-[rgb(15,23,42)] dark:hover:bg-[rgb(167,243,208)]'
      : 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={[
        'inline-flex flex-1 items-center justify-center gap-3 rounded-[14px] px-5 py-4 text-[16px] font-medium transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:shadow-none',
        classes,
      ].join(' ')}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

export default function RapportsDirecteur() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingKey, setLoadingKey] = useState('');

  const visibleReportTypes = [
    'module_progress',
    'validation_status',
    'global_platform_summary',
    'hours_by_department',
    'top_trainers',
    'module_success_rates',
  ];

  const loadReports = async () => {
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
    loadReports();
  }, []);

  const handleGenerate = async (type, format) => {
    const key = `${type}-${format}`;
    setLoadingKey(key);
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
      downloadFile(blob, buildReportFilename(report));
      await loadReports();
    } catch (generateError) {
      setError(generateError.message || 'Génération du rapport impossible.');
    } finally {
      setLoadingKey('');
    }
  };

  const groupedReports = groupReportsByType(
    reports.filter((report) => visibleReportTypes.includes(report.type)),
  );

  const handleDownload = async (report) => {
    setLoadingKey(`download-${report.id}`);
    try {
      const blob = await ReportService.download(report.id);
      downloadFile(blob, buildReportFilename(report));
    } catch (downloadError) {
      setError(downloadError.message || 'Téléchargement impossible.');
    } finally {
      setLoadingKey('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="theme-text-primary text-[28px] font-semibold tracking-tight">Génération de Rapports</h1>
        <p className="theme-text-muted mt-2 text-[18px]">Exportez des rapports détaillés en PDF ou Excel</p>
      </div>

      <div className="theme-card-muted theme-text-soft rounded-[20px] border px-5 py-4">
        Les exports PDF et Excel sont disponibles pour les rapports de direction pédagogique.
      </div>

      {error ? <div className="theme-status-danger rounded-[20px] border px-5 py-4">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <DirectorSurface className="hover-card p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Rapport progression modules</h2>
              <p className="theme-text-muted mt-2 text-[16px]">État d'avancement de tous les modules par filière</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'module-progress-pdf'}
              onClick={() => handleGenerate('module-progress', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'module-progress-xlsx'}
              onClick={() => handleGenerate('module-progress', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
          {isPdfDependencyError(error) ? (
            <p className="mt-4 text-sm text-[var(--color-warning-text)]">
              Le backend a bien répondu. Pour activer le PDF, il faut installer `backend/vendor` via Composer.
            </p>
          ) : null}
        </DirectorSurface>

        <DirectorSurface className="p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Rapport validation planning</h2>
              <p className="theme-text-muted mt-2 text-[16px]">Suivi des soumissions, statuts et notes de validation pédagogique</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'validation-status-pdf'}
              onClick={() => handleGenerate('validation-status', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'validation-status-xlsx'}
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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Synthèse globale plateforme</h2>
              <p className="theme-text-muted mt-2 text-[16px]">Vue consolidée des KPIs, validations, filières et top formateurs</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'global-platform-summary-pdf'}
              onClick={() => handleGenerate('global-platform-summary', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'global-platform-summary-xlsx'}
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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 transition-colors duration-300 dark:bg-emerald-400/20 dark:text-emerald-200">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Heures par filière</h2>
              <p className="theme-text-muted mt-2 text-[16px]">Analyse des volumes planifiés et réalisés par département pédagogique</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'hours-by-department-pdf'}
              onClick={() => handleGenerate('hours-by-department', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'hours-by-department-xlsx'}
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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-amber-50 text-amber-600 transition-colors duration-300 dark:bg-amber-400/20 dark:text-amber-200">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Top formateurs</h2>
              <p className="theme-text-muted mt-2 text-[16px]">Classement des formateurs selon l exécution réelle et les questionnaires</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'top-trainers-pdf'}
              onClick={() => handleGenerate('top-trainers', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'top-trainers-xlsx'}
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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-pink-50 text-pink-600 transition-colors duration-300 dark:bg-pink-400/20 dark:text-pink-200">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h2 className="theme-text-primary text-[18px] font-semibold">Taux de réussite modules</h2>
              <p className="theme-text-muted mt-2 text-[16px]">Taux de completion et réussite des modules pour arbitrage direction</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ReportActionButton
              loading={loadingKey === 'module-success-rates-pdf'}
              onClick={() => handleGenerate('module-success-rates', 'pdf')}
              icon={Download}
            >
              Export PDF
            </ReportActionButton>
            <ReportActionButton
              loading={loadingKey === 'module-success-rates-xlsx'}
              onClick={() => handleGenerate('module-success-rates', 'xlsx')}
              icon={Download}
              variant="secondary"
            >
              Export Excel
            </ReportActionButton>
          </div>
        </DirectorSurface>
      </div>

      <DirectorSurface className="hover-card p-6">
        <h2 className="theme-text-primary text-[18px] font-semibold">Rapports récents</h2>
        {loading ? (
          <div className="theme-text-muted py-10 text-center">Chargement des rapports...</div>
        ) : groupedReports.length === 0 ? (
          <div className="theme-text-muted py-10 text-center">Aucun rapport généré pour le moment.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {groupedReports.map((reportGroup) => (
              <div key={reportGroup.key} className="hover-row flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-white/10">
                <div>
                  <p className="theme-text-primary text-[16px] font-semibold">{reportGroup.title}</p>
                  <p className="theme-text-muted mt-1 text-sm">
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
                        disabled={loadingKey === `download-${reportGroup.formats.pdf.id}`}
                        className="report-download-button hover-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-[14px] border disabled:opacity-60"
                        data-tooltip="Télécharger PDF"
                      >
                        {loadingKey === `download-${reportGroup.formats.pdf.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
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
                        disabled={loadingKey === `download-${reportGroup.formats.xlsx.id}`}
                        className="report-download-button hover-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-[14px] border disabled:opacity-60"
                        data-tooltip="Télécharger Excel"
                      >
                        {loadingKey === `download-${reportGroup.formats.xlsx.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
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
