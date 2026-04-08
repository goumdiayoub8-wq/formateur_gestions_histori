import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Gauge,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import IconButton from "../ui/IconButton";
import { searchProjectEntries } from "../../config/searchIndex";
import DashboardService from "../../services/dashboardService";
import ChefService from "../../services/chefService";
import FormateurService from "../../services/formateurService";
import SearchService from "../../services/searchService";
import ThemeToggle from "./ThemeToggle";
import useDebouncedValue from "../../hooks/useDebouncedValue";

function getInitials(name) {
  if (!name) {
    return "AD";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || "")
    .join("");
}

function roleBadgeLabel(roleKey) {
  if (roleKey === "chef") {
    return "Chef";
  }

  if (roleKey === "formateur") {
    return "Formateur";
  }

  if (roleKey === "directeur") {
    return "Directeur";
  }

  return "Projet";
}

function roleKeyLabel(roleKey) {
  if (roleKey === "chef") {
    return "chef_de_pole";
  }

  if (roleKey === "directeur") {
    return "directeur";
  }

  return "formateur";
}

function routeFromDirectorSearch(item) {
  if (item?.entity_type === "module") {
    return `/directeur/progression-modules?module_id=${item.entity_id}`;
  }

  if (item?.entity_type === "groupe") {
    return `/directeur/progression-modules?groupe_id=${item.entity_id}`;
  }

  return `/directeur/validation-planning?q=${encodeURIComponent(item?.label || "")}`;
}

function mapDirectorSearchResults(items = []) {
  return items.map((item, index) => ({
    id:
      item?.id ||
      `${item?.entity_type || "result"}-${item?.entity_id || index}`,
    label: item?.label || "Resultat",
    title:
      item?.entity_type === "module"
        ? "Module"
        : item?.entity_type === "groupe"
          ? "Groupe"
          : "Validation planning",
    path: routeFromDirectorSearch(item),
    roleKey: "directeur",
  }));
}

function getNotificationToneClasses(severity) {
  if (severity === "danger") {
    return "border-rose-200 bg-rose-50/95 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50/95 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200";
  }

  return "border-blue-100 bg-blue-50 text-blue-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200";
}

function getNotificationIcon(notificationType) {
  if (notificationType === "validation") {
    return CalendarClock;
  }

  if (notificationType === "request") {
    return MessageSquareText;
  }

  if (notificationType === "alert") {
    return Gauge;
  }

  if (notificationType === "planning_change") {
    return MessageSquareText;
  }

  if (notificationType === "module_progress") {
    return Gauge;
  }

  if (notificationType === "assignment_suggestion") {
    return Sparkles;
  }

  return CalendarClock;
}

function mapAdminAlertsToNotifications(alerts = [], roleKey) {
  return alerts.map((alert, index) => ({
    id: `${alert.type}-${alert.formateur_id || index}`,
    title: roleKey === "chef" ? "Alerte operationnelle" : "Alerte globale",
    message: alert.message,
    severity:
      alert.type === "annual_limit_exceeded" || alert.type === "weekly_overload"
        ? "danger"
        : "warning",
    notification_type: "module_progress",
    target_path: roleKey === "chef" ? "/chef" : "/directeur",
  }));
}

export default function Navbar({
  title,
  subtitle,
  roleKey,
  userName,
  userEmail,
  userPhoto,
  roleLabel,
  onMenuToggle,
  onLogout,
}) {
  const initials = getInitials(userName);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleNotifications, setRoleNotifications] = useState([]);
  const [roleNotificationCount, setRoleNotificationCount] = useState(0);
  const isFormateur = roleKey === "formateur";
  const isChef = roleKey === "chef";
  const isDirecteur = roleKey === "directeur";
  const isAdmin = isChef || isDirecteur;
  const localResults = useMemo(
    () => searchProjectEntries(query, roleKey),
    [query, roleKey],
  );
  const hasSearchQuery = debouncedQuery.trim().length > 0;
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

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setQuery("");
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
      const cleaned = debouncedQuery.trim();

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
          setSearchResults(
            mapDirectorSearchResults(Array.isArray(rows) ? rows : []),
          );
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
  }, [debouncedQuery, isDirecteur]);

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
          const notifications = mapAdminAlertsToNotifications(
            stats?.alerts || [],
            roleKey,
          );

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
          setRoleNotificationCount(
            response?.summary?.unread ?? notifications.length,
          );
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
    setQuery("");
    setSearchOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (results.length > 0) {
      handleSelect(results[0].path);
    }
  };

  const dashboardLink = isAdmin
    ? isChef
      ? "/chef"
      : "/directeur"
    : "/formateur";
  const notificationsLink = isFormateur
    ? "/formateur/notifications"
    : isChef
      ? "/chef/notifications"
      : dashboardLink;
  const badgeLabel = roleKeyLabel(roleKey);
  const profileName = userName || roleLabel || "Utilisateur";
  const profileEmail = userEmail || "Aucune adresse email";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/90 bg-white px-4 py-4 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-none dark:backdrop-blur-xl sm:px-5 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="xl:hidden">
          <IconButton
            icon={Menu}
            label="Ouvrir le menu"
            type="neutral"
            position="bottom"
            onClick={onMenuToggle}
          />
        </div>
      </div>

      <div
        ref={searchRef}
        className="relative hidden flex-1 items-center justify-center md:flex"
      >
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 shadow-sm transition-colors duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:shadow-none">
            <Search className="h-4 w-4 text-slate-400 transition-colors duration-300 dark:text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchOpen(false);
                }
              }}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500"
            />
          </label>
        </form>

        {searchOpen ? (
          <div className="absolute left-1/2 top-[calc(100%+10px)] z-30 w-full max-w-sm -translate-x-1/2 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/95 dark:shadow-none dark:backdrop-blur-xl">
            <div className="border-b border-slate-200 px-4 py-3 transition-colors duration-300 dark:border-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition-colors duration-300 dark:text-slate-400">
                {query ? `Resultats pour "${query}"` : "Pages disponibles"}
              </p>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2">
              {searchLoading ? (
                <div className="px-3 py-8 text-center text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                  Recherche en cours...
                </div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.path)}
                    className="flex w-full items-start justify-between gap-3 rounded-[14px] px-3 py-3 text-left transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 transition-colors duration-300 dark:text-slate-400">
                        {item.title}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition-colors duration-300 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                      {roleBadgeLabel(item.roleKey)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                  Aucun resultat pour cette recherche.
                </div>
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
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition-all duration-300 hover:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:hover:bg-white/10"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {(isAdmin || isFormateur) && roleNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {roleNotificationCount > 9 ? "9+" : roleNotificationCount}
              </span>
            ) : null}
          </button>

          {(isAdmin || isFormateur) && notificationOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[360px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/95 dark:shadow-none dark:backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 transition-colors duration-300 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 dark:text-slate-400">
                  {isAdmin ? "Alertes backend" : "Notifications formateur"}
                </p>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition-colors duration-300 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                  {roleNotificationCount}
                </span>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-3">
                {roleNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {roleNotifications.map((item) => {
                      const NotificationIcon = getNotificationIcon(
                        item.notification_type || item.type,
                      );

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
                            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 transition-colors duration-300 dark:bg-white/10">
                              <NotificationIcon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold leading-5">
                                {item.title}
                              </p>
                              <p className="mt-1 text-[12px] leading-5 opacity-90">
                                {item.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-2 py-8 text-center text-sm text-slate-600 transition-colors duration-300 dark:text-slate-400">
                    Aucune notification recente.
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 px-4 py-3 transition-colors duration-300 dark:border-white/10">
                <Link
                  to={notificationsLink}
                  onClick={() => setNotificationOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors duration-300 hover:bg-slate-200 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200 dark:hover:bg-sky-400/15"
                >
                  {isFormateur
                    ? "Voir toutes les notifications"
                    : "Ouvrir le tableau de bord"}
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-3 text-slate-900 transition hover:opacity-95 dark:text-slate-100"
            title="Ouvrir le profil"
            aria-label="Ouvrir le profil"
          >
            <div className="text-left leading-tight">
              <p className="max-w-[160px] truncate text-xs font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                {profileName}
              </p>
              <p className="text-[10px] text-slate-600 transition-colors duration-300 dark:text-slate-400">
                {profileEmail}
              </p>
            </div>
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={profileName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white shadow-sm dark:shadow-none">
                {initials}
              </div>
            )}
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-all duration-300 dark:text-slate-400 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`absolute right-0 top-[calc(100%+12px)] z-30 w-[340px] origin-top-right overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/92 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)] ${
              profileOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            }`}
            aria-hidden={!profileOpen}
          >
            <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-5 py-6 transition-colors duration-300 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950/60">
              <div className="flex flex-col items-center text-center">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={profileName}
                    className="h-20 w-20 rounded-[26px] border border-white/70 object-cover shadow-sm dark:border-white/10 dark:shadow-none"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400 text-lg font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] dark:shadow-[0_12px_30px_rgba(56,189,248,0.18)]">
                    {initials}
                  </div>
                )}

                <div className="mt-4 flex min-w-0 flex-col items-center">
                  <p className="max-w-full truncate text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                    {profileName}
                  </p>
                  <span className="mt-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700 transition-colors duration-300 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                    {badgeLabel}
                  </span>

                  <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{profileEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-white/90 p-3 transition-colors duration-300 dark:bg-slate-950/70">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
                className="group flex w-full items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50/90 px-4 py-3.5 text-left transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-slate-900/75 dark:hover:border-white/15 dark:hover:bg-slate-900"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-colors duration-300 group-hover:bg-blue-100 dark:bg-sky-400/10 dark:text-sky-200 dark:group-hover:bg-sky-400/15">
                    <Settings2 className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                      Parametres
                    </span>
                    <span className="block text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400">
                      Profil, preferences et securite
                    </span>
                  </span>
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400 transition-colors duration-300 dark:text-slate-500">
                  {title}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout?.();
                }}
                className="group flex w-full items-center justify-between rounded-[20px] border border-rose-200/80 bg-gradient-to-r from-rose-50 to-rose-50/70 px-4 py-3.5 text-left transition-all duration-300 hover:from-rose-100 hover:to-rose-50 hover:shadow-sm dark:border-rose-400/25 dark:from-rose-500/12 dark:to-rose-400/6 dark:hover:from-rose-500/18 dark:hover:to-rose-400/10"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 transition-colors duration-300 dark:bg-rose-500/12 dark:text-rose-200">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-rose-700 transition-colors duration-300 dark:text-rose-200">
                      Deconnexion
                    </span>
                    <span className="block text-xs text-rose-500/90 transition-colors duration-300 dark:text-rose-300/80">
                      Quitter la session en toute securite
                    </span>
                  </span>
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-rose-400/90 transition-colors duration-300 dark:text-rose-300/80">
                  {subtitle}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
