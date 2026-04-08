import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import ReportService from '../../services/reportService';
import DashboardService from '../../services/dashboardService';
import Spinner from '../../components/ui/Spinner';

function formatHour(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '0h';
  }

  return `${Math.round(numericValue).toLocaleString('fr-FR')}h`;
}

function formatReportDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `Genere le ${date.toLocaleDateString('fr-FR')}`;
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

function ExportCard({ icon: Icon, iconClassName, title, description, actions = [] }) {
  return (
    <div className="hover-card rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-6 py-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${iconClassName}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[var(--color-text-soft)]">{title}</p>
          <p className="mt-1 text-[15px] text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.loading}
            className={`inline-flex h-[38px] w-full items-center justify-center rounded-[8px] text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${action.buttonClassName}`}
          >
            <Download className="mr-2 h-4 w-4" />
            {action.loading ? 'Generation...' : action.buttonLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RapportsChef() {
  const [reports, setReports] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState('');
  const [error, setError] = useState('');

  const visibleReportTypes = [
    'workload',
    'assignment_coverage',
    'trainer_performance',
    'teaching_load',
    'questionnaire_results',
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reportsResponse, dashboardResponse] = await Promise.all([
        ReportService.getRecent(),
        DashboardService.getStats(),
      ]);

      setReports(Array.isArray(reportsResponse) ? reportsResponse : []);
      setDashboard(dashboardResponse || null);
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const downloadBlobReport = async (report) => {
    const blob = await ReportService.download(report.id);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      report.file_name ||
      report.file_path?.split('/').pop() ||
      `rapport-${report.id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerate = async (type, format) => {
    try {
      setGeneratingKey(`${type}-${format}`);
      setError('');
      let report;

      switch (type) {
        case 'workload':
          report = await ReportService.generateWorkload(format);
          break;
        case 'assignment-coverage':
          report = await ReportService.generateAssignmentCoverage(format);
          break;
        case 'trainer-performance':
          report = await ReportService.generateTrainerPerformance(format);
          break;
        case 'teaching-hours':
          report = await ReportService.generateTeachingHours(format);
          break;
        case 'questionnaire-results':
          report = await ReportService.generateQuestionnaireResults(format);
          break;
        default:
          throw new Error('Type de rapport non pris en charge.');
      }

      await downloadBlobReport(report);
      await loadData();
    } catch (generateError) {
      setError(generateError?.message || 'Le rapport n a pas pu etre genere.');
    } finally {
      setGeneratingKey('');
    }
  };

  const handleDownload = async (report) => {
    try {
      setGeneratingKey(`download-${report.id}`);
      await downloadBlobReport(report);
    } catch (downloadError) {
      setError(downloadError?.message || 'Le rapport n a pas pu etre telecharge.');
    } finally {
      setGeneratingKey('');
    }
  };

  const summary = useMemo(() => {
    return {
      totalFormateurs: Number(dashboard?.overview?.total_formateurs || 0),
      totalModules: Number(dashboard?.overview?.total_modules || 0),
      totalHeures: dashboard?.overview?.total_module_hours || 0,
    };
  }, [dashboard]);

  const visibleReports = groupReportsByType(
    reports.filter((report) => visibleReportTypes.includes(report.type)),
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#d9e9ff]">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="chef-reports-page min-h-[calc(100vh-81px)] bg-[#d9e9ff] px-5 py-5 lg:px-5">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-primary)]">Rapports</h1>
          <p className="mt-1 text-[16px] text-[var(--color-text-muted)]">Generer et exporter des rapports</p>
        </div>

        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 text-[14px] text-[var(--color-text-muted)] shadow-sm">
          Les exports PDF et Excel sont disponibles pour les rapports opérationnels du pôle.
        </div>

        {error ? (
          <div className="rounded-[20px] border border-[#ffd5d5] bg-white px-5 py-4 text-[15px] font-semibold text-[#ca4646]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <ExportCard
            icon={FileText}
            iconClassName="bg-[linear-gradient(180deg,_#ff4b2b_0%,_#ff3d14_100%)]"
            title="Charge enseignants"
            description="Rapport complet de charge des formateurs du pôle"
            actions={[
              {
                key: 'workload-pdf',
                buttonClassName: 'bg-[#ff2f3a] hover:bg-[#f3212d]',
                buttonLabel: 'Telecharger PDF',
                loading: generatingKey === 'workload-pdf',
                onClick: () => handleGenerate('workload', 'pdf'),
              },
              {
                key: 'workload-xlsx',
                buttonClassName: 'bg-[#08c746] hover:bg-[#05b23e]',
                buttonLabel: 'Telecharger Excel',
                loading: generatingKey === 'workload-xlsx',
                onClick: () => handleGenerate('workload', 'xlsx'),
              },
            ]}
          />
          <ExportCard
            icon={FileText}
            iconClassName="bg-[linear-gradient(180deg,_#3269ff_0%,_#234fe0_100%)]"
            title="Couverture affectations"
            description="Modules affectes ou libres avec formateurs et groupes"
            actions={[
              {
                key: 'assignment-coverage-pdf',
                buttonClassName: 'bg-[#2c59e8] hover:bg-[#2148c6]',
                buttonLabel: 'Telecharger PDF',
                loading: generatingKey === 'assignment-coverage-pdf',
                onClick: () => handleGenerate('assignment-coverage', 'pdf'),
              },
              {
                key: 'assignment-coverage-xlsx',
                buttonClassName: 'bg-[#d88708] hover:bg-[#b77005]',
                buttonLabel: 'Telecharger Excel',
                loading: generatingKey === 'assignment-coverage-xlsx',
                onClick: () => handleGenerate('assignment-coverage', 'xlsx'),
              },
            ]}
          />
          <ExportCard
            icon={FileText}
            iconClassName="bg-[linear-gradient(180deg,_#20b26b_0%,_#0f8b50_100%)]"
            title="Performance par module"
            description="Analyse croisee des formateurs, modules, progression et evaluation questionnaire"
            actions={[
              {
                key: 'trainer-performance-pdf',
                buttonClassName: 'bg-[#159b5e] hover:bg-[#0f7c4b]',
                buttonLabel: 'Telecharger PDF',
                loading: generatingKey === 'trainer-performance-pdf',
                onClick: () => handleGenerate('trainer-performance', 'pdf'),
              },
              {
                key: 'trainer-performance-xlsx',
                buttonClassName: 'bg-[#0b7ec7] hover:bg-[#0868a6]',
                buttonLabel: 'Telecharger Excel',
                loading: generatingKey === 'trainer-performance-xlsx',
                onClick: () => handleGenerate('trainer-performance', 'xlsx'),
              },
            ]}
          />
          <ExportCard
            icon={FileText}
            iconClassName="bg-[linear-gradient(180deg,_#8b5cf6_0%,_#6d28d9_100%)]"
            title="Heures semaine / mois"
            description="Suivi de la charge d enseignement hebdomadaire et mensuelle du pole"
            actions={[
              {
                key: 'teaching-hours-pdf',
                buttonClassName: 'bg-[#7c3aed] hover:bg-[#6928c7]',
                buttonLabel: 'Telecharger PDF',
                loading: generatingKey === 'teaching-hours-pdf',
                onClick: () => handleGenerate('teaching-hours', 'pdf'),
              },
              {
                key: 'teaching-hours-xlsx',
                buttonClassName: 'bg-[#db2777] hover:bg-[#b91c64]',
                buttonLabel: 'Telecharger Excel',
                loading: generatingKey === 'teaching-hours-xlsx',
                onClick: () => handleGenerate('teaching-hours', 'xlsx'),
              },
            ]}
          />
          <ExportCard
            icon={FileText}
            iconClassName="bg-[linear-gradient(180deg,_#2563eb_0%,_#1d4ed8_100%)]"
            title="Resultats questionnaires"
            description="Moyennes des questionnaires par module avec taux de reponse et progression"
            actions={[
              {
                key: 'questionnaire-results-pdf',
                buttonClassName: 'bg-[#1f57ff] hover:bg-[#1747d1]',
                buttonLabel: 'Telecharger PDF',
                loading: generatingKey === 'questionnaire-results-pdf',
                onClick: () => handleGenerate('questionnaire-results', 'pdf'),
              },
              {
                key: 'questionnaire-results-xlsx',
                buttonClassName: 'bg-[#f59e0b] hover:bg-[#d88907]',
                buttonLabel: 'Telecharger Excel',
                loading: generatingKey === 'questionnaire-results-xlsx',
                onClick: () => handleGenerate('questionnaire-results', 'xlsx'),
              },
            ]}
          />
        </div>

        {isPdfDependencyError(error) ? (
          <div className="rounded-[20px] border border-[#ffe1a8] bg-[#fff8e8] px-5 py-4 text-[14px] font-medium text-[#986200]">
            Le backend répond correctement, mais le PDF a besoin de `backend/vendor`. L export Excel continue de fonctionner.
          </div>
        ) : null}

        <div className="hover-card rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-6 py-5 shadow-sm">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-soft)]">Resume</h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div>
              <p className="text-[15px] text-[#8a96aa]">Total Formateurs</p>
              <p className="chef-report-summary-value mt-2 text-[34px] font-bold tracking-tight text-[#101721]">{summary.totalFormateurs}</p>
            </div>
            <div>
              <p className="text-[15px] text-[#8a96aa]">Total Modules</p>
              <p className="chef-report-summary-value mt-2 text-[34px] font-bold tracking-tight text-[#101721]">{summary.totalModules}</p>
            </div>
            <div>
              <p className="text-[15px] text-[var(--color-text-muted)]">Total Heures</p>
              <p className="chef-report-summary-value mt-2 text-[34px] font-bold tracking-tight text-[var(--color-text-soft)]">{formatHour(summary.totalHeures)}</p>
            </div>
          </div>
        </div>

        <div className="hover-card rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-6 py-5 shadow-sm">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-soft)]">Rapports Recents</h2>

          <div className="mt-6 space-y-4">
            {visibleReports.length ? (
              visibleReports.map((reportGroup) => (
                <div
                  key={reportGroup.key}
                  className="hover-row flex items-center justify-between gap-4 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold text-[var(--color-text-soft)]">
                      {reportGroup.title}
                    </p>
                    <p className="mt-1 text-[15px] text-[var(--color-text-muted)]">{formatReportDate(reportGroup.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {reportGroup.formats.pdf ? (
                      <>
                        <span className="report-format-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          PDF
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(reportGroup.formats.pdf)}
                          disabled={generatingKey === `download-${reportGroup.formats.pdf.id}`}
                          className="report-download-button hover-icon-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition disabled:opacity-60"
                          data-tooltip="Telecharger PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                    {reportGroup.formats.xlsx ? (
                      <>
                        <span className="report-format-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          Excel
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(reportGroup.formats.xlsx)}
                          disabled={generatingKey === `download-${reportGroup.formats.xlsx.id}`}
                          className="report-download-button hover-icon-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition disabled:opacity-60"
                          data-tooltip="Telecharger Excel"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-[#d3dfef] bg-[#f8fbff] px-6 py-10 text-center text-[15px] text-[#61748f]">
                Aucun rapport recent pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
