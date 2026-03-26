import React, { useEffect, useRef, useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

function initialLetters(name) {
  if (!name) {
    return 'AD';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function DirectorHeader({
  user,
  query,
  onQueryChange,
  results,
  searchLoading,
  onSelectResult,
  onOpenMenu,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const initials = initialLetters(user?.nom);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    setOpen(query.trim().length > 0);
  }, [query]);

  return (
    <header className="theme-header sticky top-0 z-20 border-b">
      <div className="flex items-center gap-4 px-4 py-4 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="theme-icon-button inline-flex h-11 w-11 items-center justify-center rounded-[14px] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={wrapperRef} className="relative flex-1 max-w-[520px]">
          <label className="theme-input theme-focus-ring flex items-center gap-3 rounded-[16px] border px-4 py-3">
            <Search className="theme-text-muted h-5 w-5" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={() => setOpen(query.trim().length > 0)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-[15px] text-[var(--color-text-soft)] outline-none placeholder:text-[var(--color-text-subtle)]"
            />
          </label>

          {open ? (
            <div className="theme-card absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-[20px] border">
              {searchLoading ? (
                <div className="theme-text-muted px-4 py-4 text-sm">Recherche en cours...</div>
              ) : results.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto p-2">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                        onClick={() => {
                          onSelectResult(item);
                          setOpen(false);
                        }}
                      className="flex w-full items-start justify-between rounded-[16px] px-3 py-3 text-left transition hover:bg-[var(--color-hover)]"
                    >
                      <div>
                        <p className="theme-text-soft text-sm font-semibold">{item.label}</p>
                        <p className="theme-text-muted mt-1 text-xs">{item.subtitle}</p>
                      </div>
                      <span className="theme-badge rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize">
                        {item.entity_type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="theme-text-muted px-4 py-4 text-sm">Aucun résultat.</div>
              )}
            </div>
          ) : null}
        </div>

        <ThemeToggle />

        <button
          type="button"
          className="theme-icon-button relative inline-flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-[9px] top-[8px] h-2.5 w-2.5 rounded-full bg-[#ff5a5f]" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 transition hover:opacity-95"
          title="Ouvrir le profil"
          aria-label="Ouvrir le profil"
        >
          <div className="text-right">
            <p className="theme-text-soft text-[15px] font-semibold">{user?.nom || 'Admin'}</p>
            <p className="theme-text-muted text-[13px]">{user?.email || 'admin@poledigital.ma'}</p>
          </div>
          {user?.photo ? (
            <img src={user.photo} alt={user?.nom || 'Profil'} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="theme-badge inline-flex h-12 w-12 items-center justify-center rounded-full text-[26px] font-medium">
              {initials}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
