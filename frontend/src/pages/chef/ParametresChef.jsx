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
            <ChefBadge className="hover-badge" tone="violet">{config.academic_year_label}</ChefBadge>
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
            <div className="theme-card hover-card rounded-[24px] border px-5 py-5">
              <p className="theme-text-muted text-sm">Debut annee</p>
              <p className="theme-text-primary mt-3 text-2xl font-bold">{formatDate(config.start_date)}</p>
            </div>
            <div className="theme-card hover-card rounded-[24px] border px-5 py-5">
              <p className="theme-text-muted text-sm">Debut S2</p>
              <p className="theme-text-primary mt-3 text-2xl font-bold">{formatDate(config.s2_start_date)}</p>
            </div>
            <div className="theme-card hover-card rounded-[24px] border px-5 py-5">
              <p className="theme-text-muted text-sm">Fin annee</p>
              <p className="theme-text-primary mt-3 text-2xl font-bold">{formatDate(config.end_date)}</p>
            </div>
          </div>

          <ChefSection
            title="Jalons academiques"
            subtitle="Ces dates sont utilisees pour les projections de charge et les regles de semestre visibles dans le dashboard Chef."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="theme-card-muted hover-card rounded-[22px] border border-[var(--color-border)] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 transition-colors duration-300 dark:bg-blue-400/20 dark:text-blue-200">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="theme-text-muted mt-4 text-sm">Stage debut</p>
                <p className="theme-text-primary mt-2 text-lg font-semibold">{formatDate(config.stage_start_date)}</p>
              </div>
              <div className="theme-card-muted hover-card rounded-[22px] border border-[var(--color-border)] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 transition-colors duration-300 dark:bg-emerald-400/20 dark:text-emerald-200">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="theme-text-muted mt-4 text-sm">Stage fin</p>
                <p className="theme-text-primary mt-2 text-lg font-semibold">{formatDate(config.stage_end_date)}</p>
              </div>
              <div className="theme-card-muted hover-card rounded-[22px] border border-[var(--color-border)] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-amber-50 text-amber-600 transition-colors duration-300 dark:bg-amber-400/20 dark:text-amber-200">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="theme-text-muted mt-4 text-sm">Examen regional</p>
                <p className="theme-text-primary mt-2 text-lg font-semibold">{formatDate(config.exam_regional_date)}</p>
              </div>
              <div className="theme-card-muted hover-card rounded-[22px] border border-[var(--color-border)] px-5 py-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-50 text-violet-600 transition-colors duration-300 dark:bg-violet-400/20 dark:text-violet-200">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <p className="theme-text-muted mt-4 text-sm">Annee academique</p>
                <p className="theme-text-primary mt-2 text-lg font-semibold">{config.academic_year_label}</p>
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
