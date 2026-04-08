import React, { useState } from 'react';
import { AlertTriangle, CalendarRange, CheckCircle2, Clock3 } from 'lucide-react';
import AcademicConfigForm from '../../components/director/AcademicConfigForm';
import DirectorSurface from '../../components/director/DirectorSurface';
import useAcademicConfig from '../../hooks/useAcademicConfig';

function InfoCard({ icon: Icon, label, value, iconWrapperClassName, iconClassName }) {
  return (
    <DirectorSurface className="hover-card p-5">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[16px] ${iconWrapperClassName}`}>
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-3 text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
    </DirectorSurface>
  );
}

export default function AcademicConfigPage() {
  const {
    config,
    loading,
    saving,
    error,
    setError,
    saveConfig,
    validation,
    academicYearLabel,
    currentWeek,
    currentSemester,
  } = useAcademicConfig();
  const [success, setSuccess] = useState('');

  const handleSubmit = async (payload) => {
    try {
      setError('');
      setSuccess('');
      await saveConfig(payload);
      setSuccess('Configuration academique mise a jour avec succes.');
    } catch (submitError) {
      setSuccess('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-7 text-slate-900 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(90deg,_#4f35f2_0%,_#7a24f8_55%,_#d31391_100%)] dark:text-white dark:shadow-none">
        <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">Configuration Academique</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-white/80">
          Parametrez les dates de l&apos;annee scolaire, du semestre S2, du stage et de l&apos;examen regional.
        </p>
      </div>

      {error ? (
        <div className="theme-status-danger rounded-[24px] border px-6 py-5">{error}</div>
      ) : null}

      {success ? (
        <div className="theme-status-success rounded-[24px] border px-6 py-5">{success}</div>
      ) : null}

      {!loading && !config ? (
        <div className="theme-status-warning rounded-[24px] border px-6 py-5">
          Configurez l&apos;annee scolaire pour initialiser le calendrier academique.
        </div>
      ) : null}

      {!loading && config && !validation.isValid ? (
        <div className="theme-status-danger rounded-[24px] border px-6 py-5">
          La configuration academique enregistree est invalide. Corrigez-la avant de l&apos;utiliser dans les dashboards.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <InfoCard
          icon={CalendarRange}
          iconWrapperClassName="bg-blue-50 dark:bg-blue-400/20"
          iconClassName="text-blue-600 dark:text-blue-200"
          label="Annee scolaire"
          value={academicYearLabel || 'Non definie'}
        />
        <InfoCard
          icon={Clock3}
          iconWrapperClassName="bg-violet-50 dark:bg-violet-400/20"
          iconClassName="text-violet-600 dark:text-violet-200"
          label="Semaine courante"
          value={currentWeek ?? '-'}
        />
        <InfoCard
          icon={CheckCircle2}
          iconWrapperClassName="bg-emerald-50 dark:bg-emerald-400/20"
          iconClassName="text-emerald-600 dark:text-emerald-200"
          label="Semestre actuel"
          value={currentSemester || '-'}
        />
        <InfoCard
          icon={AlertTriangle}
          iconWrapperClassName="bg-orange-50 dark:bg-orange-400/20"
          iconClassName="text-orange-600 dark:text-orange-200"
          label="Examen regional"
          value={config?.exam_regional_date || '-'}
        />
      </div>

      <DirectorSurface className="p-6">
        <AcademicConfigForm initialValues={config} saving={saving} onSubmit={handleSubmit} />
      </DirectorSurface>
    </div>
  );
}
