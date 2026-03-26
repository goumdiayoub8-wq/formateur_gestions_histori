import React, { useState } from 'react';
import { AlertTriangle, CalendarRange, CheckCircle2, Clock3 } from 'lucide-react';
import AcademicConfigForm from '../../components/director/AcademicConfigForm';
import DirectorSurface from '../../components/director/DirectorSurface';
import useAcademicConfig from '../../hooks/useAcademicConfig';

function InfoCard({ icon: Icon, label, value, iconWrapperClassName, iconClassName }) {
  return (
    <DirectorSurface className="p-5">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[16px] ${iconWrapperClassName}`}>
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#95a3b7]">{label}</p>
      <p className="mt-3 text-[20px] font-bold tracking-tight text-[#1f2a3d]">{value}</p>
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
      <div className="rounded-[24px] bg-[linear-gradient(90deg,_#4f35f2_0%,_#7a24f8_55%,_#d31391_100%)] px-6 py-7 text-white">
        <h1 className="text-[28px] font-semibold tracking-tight">Configuration Academique</h1>
        <p className="mt-2 text-lg text-white/80">
          Parametrez les dates de l&apos;annee scolaire, du semestre S2, du stage et de l&apos;examen regional.
        </p>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#ffd9d9] bg-[#fff5f5] px-6 py-5 text-[#d14343]">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-[24px] border border-[#c4ebd0] bg-[#effcf3] px-6 py-5 text-[#1b7b48]">{success}</div>
      ) : null}

      {!loading && !config ? (
        <div className="rounded-[24px] border border-[#ffe4b3] bg-[#fff8ea] px-6 py-5 text-[#9a6500]">
          Configurez l&apos;annee scolaire pour initialiser le calendrier academique.
        </div>
      ) : null}

      {!loading && config && !validation.isValid ? (
        <div className="rounded-[24px] border border-[#ffd9d9] bg-[#fff5f5] px-6 py-5 text-[#d14343]">
          La configuration academique enregistree est invalide. Corrigez-la avant de l&apos;utiliser dans les dashboards.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <InfoCard
          icon={CalendarRange}
          iconWrapperClassName="bg-[#eef3ff]"
          iconClassName="text-[#3567ff]"
          label="Annee scolaire"
          value={academicYearLabel || 'Non definie'}
        />
        <InfoCard
          icon={Clock3}
          iconWrapperClassName="bg-[#f5eaff]"
          iconClassName="text-[#9333ea]"
          label="Semaine courante"
          value={currentWeek ?? '-'}
        />
        <InfoCard
          icon={CheckCircle2}
          iconWrapperClassName="bg-[#eaf9ee]"
          iconClassName="text-[#19b44b]"
          label="Semestre actuel"
          value={currentSemester || '-'}
        />
        <InfoCard
          icon={AlertTriangle}
          iconWrapperClassName="bg-[#fff4eb]"
          iconClassName="text-[#ff5a15]"
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
