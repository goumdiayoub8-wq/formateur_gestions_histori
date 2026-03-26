import React, { useEffect, useState } from 'react';
import { CalendarDays, Settings2 } from 'lucide-react';
import AcademicConfigService from '../../services/academicConfigService';
import {
  ChefAlertBanner,
  ChefBadge,
  ChefEmptyState,
  ChefLoadingState,
  ChefPageHero,
  ChefSection,
  ChefToastViewport,
  useChefToasts,
} from '../../components/chef/ChefUI';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function ParametresChef() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const { toasts, pushToast, dismissToast } = useChefToasts();

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await AcademicConfigService.getConfig();
        if (mounted) {
          setConfig(response || null);
        }
      } catch (error) {
        if (mounted) {
          pushToast({
            tone: 'danger',
            title: 'Chargement impossible',
            description:
              error.message || 'Impossible de charger la configuration academique.',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <ChefLoadingState label="Chargement du parametrage..." />;
  }

  return (
    <div className="space-y-6">
      <ChefToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ChefPageHero
        icon={Settings2}
        title="Parametrage"
        subtitle="Lecture de la configuration academique active pour piloter les affectations, l estimation hebdomadaire et le suivi de semestre."
        action={
          config?.academic_year_label ? (
            <ChefBadge tone="violet">{config.academic_year_label}</ChefBadge>
          ) : null
        }
      />

      <ChefAlertBanner
        tone="info"
        title="Lecture seule pour le Chef de pole"
        description="Les modifications du calendrier academique restent reservees au role Directeur selon les permissions backend. Cette page sert de reference operationnelle."
      />

      {config ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-[#dce6f3] bg-white px-5 py-5 shadow-[0_16px_34px_rgba(39,74,129,0.08)]">
              <p className="text-sm text-[#71859e]">Debut annee</p>
              <p className="mt-3 text-2xl font-bold text-[#1b2941]">{formatDate(config.start_date)}</p>
            </div>
            <div className="rounded-[24px] border border-[#dce6f3] bg-white px-5 py-5 shadow-[0_16px_34px_rgba(39,74,129,0.08)]">
              <p className="text-sm text-[#71859e]">Debut S2</p>
              <p className="mt-3 text-2xl font-bold text-[#1b2941]">{formatDate(config.s2_start_date)}</p>
            </div>
            <div className="rounded-[24px] border border-[#dce6f3] bg-white px-5 py-5 shadow-[0_16px_34px_rgba(39,74,129,0.08)]">
              <p className="text-sm text-[#71859e]">Fin annee</p>
              <p className="mt-3 text-2xl font-bold text-[#1b2941]">{formatDate(config.end_date)}</p>
            </div>
          </div>

          <ChefSection
            title="Jalons academiques"
            subtitle="Ces dates sont utilisees pour les projections de charge et les regles de semestre visibles dans le dashboard Chef."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eef4ff] text-[#2451ff]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-[#7b8ea8]">Stage debut</p>
                <p className="mt-2 text-lg font-semibold text-[#1b2941]">{formatDate(config.stage_start_date)}</p>
              </div>
              <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eefbf3] text-[#16a34a]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-[#7b8ea8]">Stage fin</p>
                <p className="mt-2 text-lg font-semibold text-[#1b2941]">{formatDate(config.stage_end_date)}</p>
              </div>
              <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#fff6ea] text-[#f97316]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-[#7b8ea8]">Examen regional</p>
                <p className="mt-2 text-lg font-semibold text-[#1b2941]">{formatDate(config.exam_regional_date)}</p>
              </div>
              <div className="rounded-[22px] border border-[#dce6f3] bg-[#fbfdff] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f4efff] text-[#8b5cf6]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-[#7b8ea8]">Annee academique</p>
                <p className="mt-2 text-lg font-semibold text-[#1b2941]">{config.academic_year_label}</p>
              </div>
            </div>
          </ChefSection>
        </>
      ) : (
        <ChefEmptyState
          title="Configuration academique indisponible"
          description="Aucune configuration n est encore definie. Le Directeur devra renseigner les dates de reference avant de fiabiliser les projections."
        />
      )}
    </div>
  );
}
