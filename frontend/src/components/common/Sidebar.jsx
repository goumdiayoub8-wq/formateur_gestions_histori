import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, GraduationCap, LogOut } from 'lucide-react';
import casablancaSettatLogo from '../../style/photos/Casablanca-Settat_VF.png';

function getAcademicYearLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 7 ? year : year - 1;

  return `${startYear} - ${startYear + 1}`;
}

export default function Sidebar({ items, roleKey, roleLabel, onLogout, onClose }) {
  const academicYear = getAcademicYearLabel();

  return (
    <aside className="theme-sidebar sticky top-0 flex h-screen flex-col overflow-hidden border-r">
      <div className="theme-border border-b px-6 py-5">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="theme-card-muted theme-border flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[22px] border shadow-[0_10px_26px_var(--color-shadow)]">
            <img
              src={casablancaSettatLogo}
              alt="Casablanca Settat"
              className="h-[62px] w-[62px] object-contain"
            />
          </div>
          <p className="theme-text-muted mt-3 text-[9px] uppercase tracking-[0.24em]">Gestion des horaires</p>
          <h2 className="theme-text-soft mt-1 text-[13px] font-semibold">{roleLabel}</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 text-sm transition-all duration-300',
                  'rounded-[16px] px-3 py-3 font-medium',
                  isActive
                    ? 'bg-[#edf3ff] text-[#2453e5]'
                    : 'theme-text-muted hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-[#5d78a0] transition-colors duration-300 group-hover:text-[#2d5cff]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive ? <ChevronRight className="theme-text-muted h-4 w-4" /> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="theme-border sticky bottom-0 mt-6 space-y-3 border-t bg-transparent px-4 py-4">
        <div className="theme-card-muted rounded-[18px] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#7561dd]">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="theme-text-muted text-[10px] uppercase tracking-[0.24em]">Annee scolaire</p>
              <p className="theme-text-soft mt-1 text-sm font-semibold">{academicYear}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="theme-border theme-text-soft flex w-full items-center justify-between border-t px-2 py-4 text-sm font-medium transition hover:text-[var(--color-text)]"
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px]">
              <LogOut className="h-4 w-4" />
            </span>
            Deconnexion
          </span>
          <ChevronRight className="theme-text-muted h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
