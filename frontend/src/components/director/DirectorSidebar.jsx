import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import casablancaSettatLogo from '../../style/photos/Casablanca-Settat_VF.png';
import useAcademicConfig from '../../hooks/useAcademicConfig';

export default function DirectorSidebar({ items, onLogout, onClose }) {
  const { academicYearLabel } = useAcademicConfig();

  return (
    <aside className="theme-sidebar flex h-screen w-[272px] flex-col border-r">
      <div className="theme-border border-b px-6 py-6">
        <div className="flex flex-col items-center justify-center">
          <img src={casablancaSettatLogo} alt="CMC CS" className="h-[76px] w-[76px] object-contain" />
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-[18px] px-4 py-4 text-[15px] font-medium transition',
                  isActive
                    ? 'bg-[#ebf2ff] text-[#2563ff]'
                    : 'theme-text-muted hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="theme-border border-t px-4 py-4">
        <div className="theme-card-muted rounded-[20px] px-6 py-5">
          <p className="theme-text-muted text-sm">Année scolaire</p>
          <p className="theme-text-soft mt-2 text-[28px] font-semibold tracking-tight">{academicYearLabel || 'Non definie'}</p>
        </div>
      </div>

      <div className="theme-border border-t px-4 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="theme-text-soft flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-[15px] font-medium transition hover:bg-[var(--color-hover)]"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
