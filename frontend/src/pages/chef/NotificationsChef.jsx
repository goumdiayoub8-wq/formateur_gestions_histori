import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCheck, ClipboardPenLine, MessageSquareText, RefreshCw, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChefService from '../../services/chefService';
import PageHeader from '../../components/ui/PageHeader';
import MetricCard from '../../components/ui/MetricCard';
import { Card, CardTitle } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import IconButton from '../../components/ui/IconButton';

function formatNotificationDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getToneClasses(severity) {
  if (severity === 'danger') {
    return 'theme-status-danger';
  }

  if (severity === 'warning') {
    return 'theme-status-warning';
  }

  return 'theme-status-info';
}

function isPendingChangeNotification(item) {
  return item.alert_type === 'planning_change' && item.metadata?.status === 'pending_change' && item.metadata?.entry_id;
}

export default function NotificationsChef() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [responseNotes, setResponseNotes] = useState({});

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ChefService.getNotifications();
      setNotifications(response.notifications || []);
      setCount(Number(response.count || 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement des notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleReview = async (item, status) => {
    if (!item?.metadata?.entry_id || !item?.metadata?.formateur_id) {
      setError('Cette notification ne contient pas assez de contexte pour etre traitee.');
      return;
    }

    try {
      setActionLoadingId(item.id);
      setError('');
      await ChefService.reviewPlanningChange({
        id: item.metadata.entry_id,
        formateur_id: item.metadata.formateur_id,
        alert_id: item.id,
        status,
        note: (responseNotes[item.id] || '').trim(),
      });
      setResponseNotes((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de repondre a la demande de changement.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const byType = useMemo(() => {
    return notifications.reduce(
      (accumulator, item) => {
        if (item.alert_type === 'planning_change') {
          accumulator.change += 1;
        } else if (item.alert_type === 'planning_validation') {
          accumulator.validation += 1;
        }
        return accumulator;
      },
      { change: 0, validation: 0 },
    );
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-10 w-10 border-[var(--color-border-strong)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="theme-status-danger rounded-[18px] p-5">
        <p className="text-sm font-semibold">{error}</p>
      </Card>
    );
  }

  return (
    <div className="chef-notifications-page space-y-6">
      <PageHeader
        eyebrow="Chef de pôle"
        title="Notifications"
        description="Suivez les confirmations, demandes de changement et validations de planning dans un seul flux."
        actions={
          <>
            <IconButton
              icon={ClipboardPenLine}
              label="Ouvrir le planning"
              type="edit"
              position="bottom"
              to="/chef/planning"
            />
            <IconButton
              icon={RefreshCw}
              label="Actualiser"
              type="refresh"
              position="bottom"
              onClick={loadNotifications}
            />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          className="hover-card"
          icon={BellRing}
          label="Notifications actives"
          value={count}
          meta="Flux chef de pôle"
          tone="brand"
        />
        <MetricCard
          className="hover-card"
          icon={BellRing}
          label="Demandes de changement"
          value={byType.change}
          meta="Signalées par les formateurs"
          tone="amber"
        />
        <MetricCard
          className="hover-card"
          icon={BellRing}
          label="Confirmations & validations"
          value={byType.validation}
          meta="Sessions prêtes à suivre"
          tone="rose"
        />
      </div>

      <Card>
        <CardTitle
          eyebrow="Temps réel"
          title="Dernières notifications"
          description="Les événements de planning importants apparaissent ici automatiquement."
        />

        {notifications.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="Aucune notification récente"
            description="Les confirmations et demandes de changement apparaitront ici dès qu'elles seront envoyées."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.target_path) {
                    navigate(item.target_path, { state: item.target_state || undefined });
                  }
                }}
                className={`hover-row rounded-[18px] border px-4 py-4 shadow-[0_6px_18px_rgba(34,77,132,0.04)] ${getToneClasses(item.severity)} ${item.target_path ? 'cursor-pointer transition hover:-translate-y-0.5' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="chef-notification-title text-[15px] font-semibold leading-6">{item.title}</p>
                    <p className="mt-1 text-[14px] leading-6 opacity-90">{item.message}</p>
                  </div>
                  <span className="theme-card rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {item.alert_type === 'planning_change' ? 'Changement' : 'Validation'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.metadata?.trainer_name ? (
                    <span className="theme-card theme-text-soft rounded-full px-3 py-1 text-[11px] font-semibold">
                      {item.metadata.trainer_name}
                    </span>
                  ) : null}
                  {item.metadata?.module_code ? (
                    <span className="theme-card hover-badge theme-text-soft rounded-full px-3 py-1 text-[11px] font-semibold" data-tooltip={item.message?.match(/module\s+(.+?)\s+est/)?.[1] || 'Module code'}>
                      {item.metadata.module_code}
                    </span>
                  ) : null}
                  {item.metadata?.week_number ? (
                    <span className="theme-card theme-text-soft rounded-full px-3 py-1 text-[11px] font-semibold">
                      Semaine {item.metadata.week_number}
                    </span>
                  ) : null}
                </div>

                {item.details && item.details !== item.message ? (
                  <div className="theme-card theme-text-soft mt-4 rounded-[16px] border px-4 py-3">
                    <div className="theme-text-muted flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
                      <MessageSquareText className="h-4 w-4" />
                      Message du formateur
                    </div>
                    <p className="mt-2 text-[14px] leading-6">{item.details}</p>
                  </div>
                ) : null}

                {isPendingChangeNotification(item) ? (
                  <div
                    className="theme-card mt-4 rounded-[16px] border p-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <label className="block">
                      <span className="theme-text-muted text-[12px] font-semibold uppercase tracking-[0.14em]">
                        Reponse au formateur
                      </span>
                      <textarea
                        value={responseNotes[item.id] || ''}
                        onChange={(event) =>
                          setResponseNotes((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Ajoutez une reponse claire pour le formateur..."
                        data-testid="chef-notification-response-input"
                        className="chef-notification-response-input theme-input theme-focus-ring mt-2 w-full rounded-[14px] border px-3 py-3 text-sm outline-none transition placeholder:text-[var(--color-text-subtle)] focus:ring-2"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleReview(item, 'validated')}
                        data-testid="chef-notification-approve"
                        className="theme-status-success hover-icon-btn inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                        data-tooltip="Accepter le changement"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Valider
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleReview(item, 'rejected')}
                        data-testid="chef-notification-reject"
                        className="theme-status-warning hover-icon-btn inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                        data-tooltip="Refuser le changement"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ) : null}

                <p className="mt-3 text-[12px] opacity-70">{formatNotificationDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
