import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import ReportService from '../../services/reportService';
import FormateurService from '../../services/formateurService';
import ModuleService from '../../services/moduleService';
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

function ExportCard({ icon: Icon, iconClassName, title, description, buttonClassName, buttonLabel, loading, onClick }) {
  return (
    <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-6 py-6 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${iconClassName}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[#1c2436]">{title}</p>
          <p className="mt-1 text-[15px] text-[#717f95]">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`mt-8 inline-flex h-[38px] w-full items-center justify-center rounded-[8px] text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${buttonClassName}`}
      >
        <Download className="mr-2 h-4 w-4" />
        {loading ? 'Generation...' : buttonLabel}
      </button>
    </div>
  );
}

export default function RapportsChef() {
  const [reports, setReports] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [modules, setModules] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reportsResponse, formateursResponse, modulesResponse, dashboardResponse] = await Promise.all([
        ReportService.getRecent(),
        FormateurService.list(),
        ModuleService.list(),
        DashboardService.getStats(),
      ]);

      setReports(Array.isArray(reportsResponse) ? reportsResponse : []);
      setFormateurs(Array.isArray(formateursResponse) ? formateursResponse : []);
      setModules(Array.isArray(modulesResponse) ? modulesResponse : []);
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

  const handleGenerate = async (format) => {
    try {
      setGeneratingKey(format);
      setError('');
      const report = await ReportService.generateWorkload(format);
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
      await downloadBlobReport(report);
    } catch (downloadError) {
      setError(downloadError?.message || 'Le rapport n a pas pu etre telecharge.');
    }
  };

  const summary = useMemo(() => {
    return {
      totalFormateurs: formateurs.length,
      totalModules: modules.length,
      totalHeures: dashboard?.overview?.total_module_hours || 0,
    };
  }, [dashboard, formateurs.length, modules.length]);

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
          <h1 className="text-[26px] font-bold tracking-tight text-[#3550f2]">Rapports</h1>
          <p className="mt-1 text-[16px] text-[#6f7f95]">Generer et exporter des rapports</p>
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
            title="Export PDF"
            description="Rapport complet au format PDF"
            buttonClassName="bg-[#ff2f3a] hover:bg-[#f3212d]"
            buttonLabel="Telecharger PDF"
            loading={generatingKey === 'pdf'}
            onClick={() => handleGenerate('pdf')}
          />
          <ExportCard
            icon={FileSpreadsheet}
            iconClassName="bg-[linear-gradient(180deg,_#10c754_0%,_#09b947_100%)]"
            title="Export Excel"
            description="Donnees brutes au format Excel"
            buttonClassName="bg-[#08c746] hover:bg-[#05b23e]"
            buttonLabel="Telecharger Excel"
            loading={generatingKey === 'xlsx'}
            onClick={() => handleGenerate('xlsx')}
          />
        </div>

        <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-6 py-5 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#1d2435]">Resume</h2>

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
              <p className="text-[15px] text-[#8a96aa]">Total Heures</p>
              <p className="chef-report-summary-value mt-2 text-[34px] font-bold tracking-tight text-[#101721]">{formatHour(summary.totalHeures)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#dbe5f2] bg-white px-6 py-5 shadow-[0_2px_6px_rgba(62,90,135,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#1d2435]">Rapports Recents</h2>

          <div className="mt-6 space-y-4">
            {reports.length ? (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-[#e2e8f2] bg-white px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold text-[#1b2232]">
                      {report.title || report.type || `Rapport #${report.id}`}
                    </p>
                    <p className="mt-1 text-[15px] text-[#7c879b]">{formatReportDate(report.created_at)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(report)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#263246] transition hover:bg-[#f4f7fb]"
                    title="Telecharger"
                  >
                    <Download className="h-5 w-5" />
                  </button>
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
