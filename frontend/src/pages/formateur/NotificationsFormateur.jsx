import React, { useEffect, useState } from 'react';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import { FormateurEmptyBlock, FormateurPanel, FormateurSectionHeader, FormateurStatCard } from '../../components/formateur/FormateurUI';

function notificationClasses(tone) {
  if (tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200';
  }

  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200';
  }

  if (tone === 'danger') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsFormateur() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await FormateurService.getNotifications();

        if (mounted) {
          setPayload(response);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || 'Impossible de charger les notifications.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-slate-200 border-t-blue-600 dark:border-white/10 dark:border-t-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="theme-card-muted rounded-[28px] border border-[var(--color-border)] px-6 py-7">
        <h1 className="theme-text-primary text-[22px] font-bold tracking-tight">Notifications</h1>
        <p className="theme-text-muted mt-2 text-[15px]">
          {payload?.summary?.unread || 0} notifications non lues
        </p>
      </div>

      {error ? (
        <FormateurPanel className="theme-status-danger px-6 py-5 text-[15px] font-semibold">{error}</FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <FormateurStatCard className="hover-card" icon={() => null} iconClassName="hidden" label="Total" value={payload?.summary?.total || 0} />
        <FormateurStatCard className="hover-card" icon={() => null} iconClassName="hidden" label="Validations" value={payload?.summary?.validations || 0} />
        <FormateurStatCard className="hover-card" icon={() => null} iconClassName="hidden" label="Alertes" value={payload?.summary?.alertes || 0} />
      </div>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Notifications recentes" />
        <div className="mt-6 space-y-4">
          {payload?.notifications?.length ? (
            payload.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`hover-row rounded-[20px] border px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${notificationClasses(notification.tone)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold leading-7">{notification.title}</p>
                    <p className="mt-1 text-[15px] leading-7 opacity-90">{notification.message}</p>
                    <p className="mt-2 text-[14px] opacity-70">{formatDate(notification.date)}</p>
                  </div>
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-current opacity-80" />
                </div>
              </div>
            ))
          ) : (
            <FormateurEmptyBlock
              title="Aucune notification recente"
              description="Les validations, rappels et alertes apparaitront ici automatiquement."
            />
          )}
        </div>
      </FormateurPanel>
    </div>
  );
}
