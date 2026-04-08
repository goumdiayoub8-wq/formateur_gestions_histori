import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, GraduationCap, LogOut } from "lucide-react";
import casablancaSettatLogo from "../../style/photos/Casablanca-Settat_VF.png";

function getAcademicYearLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 7 ? year : year - 1;

  return `${startYear} - ${startYear + 1}`;
}

export default function Sidebar({
  items,
  roleKey,
  roleLabel,
  onLogout,
  onClose,
}) {
  const academicYear = getAcademicYearLabel();

  return (
    <aside className="sticky top-0 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-900 backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:backdrop-blur-xl">
      <div className="border-b border-slate-200 bg-white px-6 py-6 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
            <img
              src={casablancaSettatLogo}
              alt="Casablanca Settat"
              className="h-[62px] w-[62px] object-contain"
            />
          </div>
          <p className="mt-3 text-[9px] uppercase tracking-[0.24em] text-slate-600 transition-colors duration-300 dark:text-slate-400">
            Gestion des horaires
          </p>
          <h2 className="mt-1 text-[13px] font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
            {roleLabel}
          </h2>
        </div>
      </div>

      <nav
        className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5"
        aria-label="Navigation principale"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 text-sm transition-all duration-300",
                  "rounded-[16px] px-3 py-3 font-medium",
                  isActive
                    ? "border border-slate-200 bg-slate-100 text-slate-900 shadow-sm dark:bg-sky-400/10 dark:text-sky-300 dark:border-white/0"
                    : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100 dark:hover:border-white/0",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-100 text-slate-500 transition-colors duration-300 group-hover:bg-white group-hover:text-blue-600 dark:bg-transparent dark:text-slate-500 dark:group-hover:text-sky-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive ? (
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-colors duration-300 dark:text-slate-500" />
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sticky bottom-0 mt-6 space-y-3 border-t border-slate-200 bg-white px-4 py-4 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/40">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm backdrop-blur-none transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600 transition-colors duration-300 dark:bg-sky-400/10 dark:text-sky-300">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-600 transition-colors duration-300 dark:text-slate-400">
                Annee scolaire
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                {academicYear}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-between rounded-[16px] border border-transparent px-2 py-3 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:border-white/0 dark:text-slate-100 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px]">
              <LogOut className="h-4 w-4" />
            </span>
            Deconnexion
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-colors duration-300 dark:text-slate-500" />
        </button>
      </div>
    </aside>
  );
}
