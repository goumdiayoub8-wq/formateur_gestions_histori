import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Navbar";
import { logoutUser } from "../store/slices/authSlice";

export default function RoleLayout({ roleKey, roleLabel, navigation }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(
    () =>
      navigation.find((item) => location.pathname === item.path) ||
      (location.pathname === "/profile"
        ? {
            label: "Parametres",
          }
        : navigation[0]),
    [location.pathname, navigation],
  );

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="theme-page-shell min-h-screen text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen w-full">
        <div className="theme-sidebar hidden shrink-0 xl:block xl:w-[244px] dark:border-white/10 dark:bg-slate-900/80">
          <Sidebar
            items={navigation}
            roleKey={roleKey}
            roleLabel={roleLabel}
            userName={user?.nom}
            onLogout={handleLogout}
          />
        </div>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-900/8 transition-colors duration-300 dark:bg-black/50 xl:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="h-full w-80"
              onClick={(event) => event.stopPropagation()}
            >
              <Sidebar
                items={navigation}
                roleKey={roleKey}
                roleLabel={roleLabel}
                userName={user?.nom}
                onLogout={handleLogout}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 w-full flex-1 bg-[var(--bg-secondary)]">
          <Navbar
            title={activeItem?.label || roleLabel}
            subtitle={`${roleLabel} · ${roleKey}`}
            roleKey={roleKey}
            userName={user?.nom}
            userEmail={user?.email}
            userPhoto={user?.photo}
            roleLabel={roleLabel}
            onMenuToggle={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
          <div className="px-4 py-5 md:px-5 lg:px-7 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
