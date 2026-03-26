import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, ChevronDown, Gauge, Menu, MessageSquareText, Search, Sparkles } from 'lucide-react';
import IconButton from '../ui/IconButton';
import { searchProjectEntries } from '../../config/searchIndex';
import DashboardService from '../../services/dashboardService';
import ChefService from '../../services/chefService';
import FormateurService from '../../services/formateurService';
import SearchService from '../../services/searchService';
import ThemeToggle from './ThemeToggle';

function getInitials(name) {
  if (!name) {
    return 'AD';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('');
}

function roleBadgeLabel(roleKey) {
  if (roleKey === 'chef') {
    return 'Chef';
  }

  if (roleKey === 'formateur') {
    return 'Formateur';
  }

  if (roleKey === 'directeur') {
    return 'Directeur';
  }

  return 'Projet';
}

function roleKeyLabel(roleKey) {
  if (roleKey === 'chef') {
    return 'chef_de_pole';
  }

  if (roleKey === 'directeur') {
    return 'directeur';
  }

  return 'formateur';
}

function routeFromDirectorSearch(item) {
  if (item?.entity_type === 'module') {
    return `/directeur/progression-modules?module_id=${item.entity_id}`;
  }

  if (item?.entity_type === 'groupe') {
    return `/directeur/progression-modules?groupe_id=${item.entity_id}`;
  }

  return `/directeur/validation-planning?q=${encodeURIComponent(item?.label || '')}`;
}

function mapDirectorSearchResults(items = []) {
  return items.map((item, index) => ({
    id: item?.id || `${item?.entity_type || 'result'}-${item?.entity_id || index}`,
    label: item?.label || 'Resultat',
    title:
      item?.entity_type === 'module'
        ? 'Module'
        : item?.entity_type === 'groupe'
          ? 'Groupe'
          : 'Validation planning',
    path: routeFromDirectorSearch(item),
    roleKey: 'directeur',
  }));
}

function getNotificationToneClasses(severity) {
  if (severity === 'danger') {
    return 'border-[#ffd5d5] bg-[#fff5f5] text-[#c84d4d]';
  }

  if (severity === 'warning') {
    return 'border-[#f5dfb7] bg-[#fff8ec] text-[#b67d16]';
  }

  return 'border-[#dbe8ff] bg-[#f4f8ff] text-[#496db2]';
}

function getNotificationIcon(notificationType) {
  if (notificationType === 'validation') {
    return CalendarClock;
  }

  if (notificationType === 'request') {
    return MessageSquareText;
  }

  if (notificationType === 'alert') {
    return Gauge;
  }

  if (notificationType === 'planning_change') {
    return MessageSquareText;
  }

  if (notificationType === 'module_progress') {
    return Gauge;
  }

  if (notificationType === 'assignment_suggestion') {
    return Sparkles;
  }

  return CalendarClock;
}

function mapAdminAlertsToNotifications(alerts = [], roleKey) {
  return alerts.map((alert, index) => ({
    id: `${alert.type}-${alert.formateur_id || index}`,
    title: roleKey === 'chef' ? 'Alerte operationnelle' : 'Alerte globale',
    message: alert.message,
    severity:
      alert.type === 'annual_limit_exceeded' || alert.type === 'weekly_overload' ? 'danger' : 'warning',
    notification_type: 'module_progress',
    target_path: roleKey === 'chef' ? '/chef' : '/directeur',
  }));
}

export default function Navbar({ title, subtitle, roleKey, userName, userEmail, userPhoto, roleLabel, onMenuToggle, onLogout }) {
  const initials = getInitials(userName);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleNotifications, setRoleNotifications] = useState([]);
  const [roleNotificationCount, setRoleNotificationCount] = useState(0);
  const isFormateur = roleKey === 'formateur';
  const isChef = roleKey === 'chef';
  const isDirecteur = roleKey === 'directeur';
  const isAdmin = isChef || isDirecteur;
  const localResults = useMemo(() => searchProjectEntries(query, roleKey), [query, roleKey]);
  const hasSearchQuery = deferredQuery.trim().length > 0;
  const results = isDirecteur && hasSearchQuery ? searchResults : localResults;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }

      if (!notificationRef.current?.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setQuery('');
    setSearchOpen(false);
    setSearchResults([]);
    setSearchLoading(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isDirecteur) {
      return undefined;
    }

    let active = true;

    const loadSearch = async () => {
      const cleaned = deferredQuery.trim();

      if (!cleaned) {
        if (active) {
          setSearchResults([]);
          setSearchLoading(false);
        }
        return;
      }

      setSearchLoading(true);
      try {
        const rows = await SearchService.globalSearch(cleaned, 6);
        if (active) {
          setSearchResults(mapDirectorSearchResults(Array.isArray(rows) ? rows : []));
        }
      } catch (error) {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    };

    loadSearch();

    return () => {
      active = false;
    };
  }, [deferredQuery, isDirecteur]);

  useEffect(() => {
    let mounted = true;

    const loadRoleNotifications = async () => {
      if (!isAdmin && !isFormateur) {
        return;
      }

      try {
        if (isChef) {
          const response = await ChefService.getNotifications();
          const notifications = response?.notifications || [];

          if (mounted) {
            setRoleNotifications(notifications);
            setRoleNotificationCount(response?.count ?? notifications.length);
          }

          return;
        }

        if (isDirecteur) {
          const stats = await DashboardService.getStats();
          const notifications = mapAdminAlertsToNotifications(stats?.alerts || [], roleKey);

          if (mounted) {
            setRoleNotifications(notifications);
            setRoleNotificationCount(notifications.length);
          }

          return;
        }

        const response = await FormateurService.getNotifications();
        const notifications = response?.notifications || [];

        if (mounted) {
          setRoleNotifications(notifications);
          setRoleNotificationCount(response?.summary?.unread ?? notifications.length);
        }
      } catch (error) {
        if (mounted) {
          setRoleNotifications([]);
          setRoleNotificationCount(0);
        }
      }
    };

    loadRoleNotifications();

    return () => {
      mounted = false;
    };
  }, [isAdmin, isFormateur, roleKey]);

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setSearchOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (results.length > 0) {
      handleSelect(results[0].path);
    }
  };

  const dashboardLink = isAdmin ? (isChef ? '/chef' : '/directeur') : '/formateur';
  const notificationsLink = isFormateur ? '/formateur/notifications' : isChef ? '/chef/notifications' : dashboardLink;
  const badgeLabel = roleKeyLabel(roleKey);
  const profileName = userName || roleLabel || 'Utilisateur';
  const profileEmail = userEmail || 'Aucune adresse email';

  return (
    <header className="theme-header sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="xl:hidden">
          <IconButton icon={Menu} label="Ouvrir le menu" type="neutral" position="bottom" onClick={onMenuToggle} />
        </div>
      </div>

      <div ref={searchRef} className="relative hidden flex-1 items-center justify-center md:flex">
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <label className="theme-input theme-focus-ring flex w-full items-center gap-2 rounded-[14px] border px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <Search className="theme-text-muted h-4 w-4" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-sm text-[var(--color-text-soft)] outline-none placeholder:text-[var(--color-text-subtle)]"
            />
          </label>
        </form>

        {searchOpen ? (
          <div className="theme-card absolute left-1/2 top-[calc(100%+10px)] z-30 w-full max-w-sm -translate-x-1/2 overflow-hidden rounded-[18px] border">
            <div className="theme-border border-b px-4 py-3">
              <p className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.2em]">
                {query ? `Resultats pour "${query}"` : 'Pages disponibles'}
              </p>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2">
              {searchLoading ? (
                <div className="theme-text-muted px-3 py-8 text-center text-sm">Recherche en cours...</div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.path)}
                    className="flex w-full items-start justify-between gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-[var(--color-hover)]"
                  >
                    <div className="min-w-0">
                      <p className="theme-text-soft truncate text-sm font-semibold">{item.label}</p>
                      <p className="theme-text-muted mt-1 text-xs">{item.title}</p>
                    </div>
                    <span className="theme-badge shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold">
                      {roleBadgeLabel(item.roleKey)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="theme-text-muted px-3 py-8 text-center text-sm">Aucun resultat pour cette recherche.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle compact={isFormateur || isChef} />

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((current) => !current)}
            className="theme-icon-button relative inline-flex h-10 w-10 items-center justify-center rounded-full transition"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {(isAdmin || isFormateur) && roleNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#ff5b5b] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {roleNotificationCount > 9 ? '9+' : roleNotificationCount}
              </span>
            ) : null}
          </button>

          {(isAdmin || isFormateur) && notificationOpen ? (
            <div className="theme-card absolute right-0 top-[calc(100%+12px)] z-30 w-[360px] overflow-hidden rounded-[18px] border">
              <div className="theme-border flex items-center justify-between border-b px-4 py-3">
                <p className="theme-text-muted text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {isAdmin ? 'Alertes backend' : 'Notifications formateur'}
                </p>
                <span className="theme-badge rounded-full px-2.5 py-1 text-[10px] font-semibold">
                  {roleNotificationCount}
                </span>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-3">
                {roleNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {roleNotifications.map((item) => {
                      const NotificationIcon = getNotificationIcon(item.notification_type || item.type);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigate(item.target_path || notificationsLink);
                            setNotificationOpen(false);
                          }}
                          className={`w-full rounded-[14px] border px-3 py-3 text-left transition hover:-translate-y-0.5 ${getNotificationToneClasses(item.severity || item.tone)}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                              <NotificationIcon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold leading-5">{item.title}</p>
                              <p className="mt-1 text-[12px] leading-5 opacity-90">{item.message}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="theme-text-muted px-2 py-8 text-center text-sm">Aucune notification recente.</div>
                )}
              </div>
              <div className="theme-border border-t px-4 py-3">
                <Link
                  to={notificationsLink}
                  onClick={() => setNotificationOpen(false)}
                  className="theme-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:brightness-105"
                >
                  {isFormateur ? 'Voir toutes les notifications' : 'Ouvrir le tableau de bord'}
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-3 transition hover:opacity-95"
            title="Ouvrir le profil"
            aria-label="Ouvrir le profil"
          >
            <div className="text-left leading-tight">
              <p className="theme-text-soft max-w-[160px] truncate text-xs font-semibold">{profileName}</p>
              <p className="theme-text-muted text-[10px]">{profileEmail}</p>
            </div>
            {userPhoto ? (
              <img src={userPhoto} alt={profileName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6d4aff] text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <ChevronDown
              className={`theme-text-muted h-4 w-4 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`theme-card absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] origin-top-right rounded-[24px] border shadow-lg transition duration-200 ${
              profileOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
            }`}
            aria-hidden={!profileOpen}
          >
            <div className="theme-border flex items-start gap-4 border-b px-5 py-5">
              {userPhoto ? (
                <img src={userPhoto} alt={profileName} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6d4aff] text-sm font-bold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="theme-text-soft truncate text-sm font-semibold">{profileName}</p>
                  <span className="theme-badge inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {badgeLabel}
                  </span>
                </div>
                <p className="theme-text-muted mt-2 truncate text-xs">{profileEmail}</p>
              </div>
            </div>

            <div className="space-y-2 p-3">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
                className="theme-card-muted theme-text-soft flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium transition hover:brightness-95"
              >
                <span>Parametres</span>
                <span className="theme-text-muted text-xs">{title}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout?.();
                }}
                className="flex w-full items-center justify-between rounded-[18px] border border-[#f1d1d1] bg-[#fff6f6] px-4 py-3 text-left text-sm font-medium text-[#bf4f4f] transition hover:bg-[#fff0f0]"
              >
                <span>Deconnexion</span>
                <span className="text-xs opacity-70">{subtitle}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
