import React, { useEffect, useState } from 'react';
import FormateurService from '../../services/formateurService';
import Spinner from '../../components/ui/Spinner';
import { FormateurEmptyBlock, FormateurPanel, FormateurSectionHeader, FormateurStatCard } from '../../components/formateur/FormateurUI';

function notificationClasses(tone) {
  if (tone === 'success') {
    return 'border-[#bff0cc] bg-[#effcf3] text-[#1d5b34]';
  }

  if (tone === 'warning') {
    return 'border-[#f3d970] bg-[#fff9e8] text-[#7a5e00]';
  }

  if (tone === 'danger') {
    return 'border-[#f6cccc] bg-[#fff3f3] text-[#8a3c3c]';
  }

  return 'border-[#bfdcff] bg-[#eef5ff] text-[#28539e]';
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
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] bg-[#f7f9fd] px-6 py-7">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1f2a3d]">Notifications</h1>
        <p className="mt-2 text-[15px] text-[#75859c]">
          {payload?.summary?.unread || 0} notifications non lues
        </p>
      </div>

      {error ? (
        <FormateurPanel className="px-6 py-5 text-[15px] font-semibold text-[#b54545]">{error}</FormateurPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <FormateurStatCard icon={() => null} iconClassName="hidden" label="Total" value={payload?.summary?.total || 0} />
        <FormateurStatCard icon={() => null} iconClassName="hidden" label="Validations" value={payload?.summary?.validations || 0} />
        <FormateurStatCard icon={() => null} iconClassName="hidden" label="Alertes" value={payload?.summary?.alertes || 0} />
      </div>

      <FormateurPanel className="p-6">
        <FormateurSectionHeader title="Notifications recentes" />
        <div className="mt-6 space-y-4">
          {payload?.notifications?.length ? (
            payload.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-[20px] border px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${notificationClasses(notification.tone)}`}
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
