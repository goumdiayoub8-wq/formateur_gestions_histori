import React, { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { logoutUser } from '../store/slices/authSlice';

export default function RoleLayout({ roleKey, roleLabel, navigation }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(
    () =>
      navigation.find((item) => location.pathname === item.path) ||
      (location.pathname === '/profile'
        ? {
            label: 'Parametres',
          }
        : navigation[0]),
    [location.pathname, navigation],
  );

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div className="theme-page-shell min-h-screen">
      <div className="flex min-h-screen w-full">
        <div className="hidden shrink-0 xl:block xl:w-[244px]">
          <Sidebar items={navigation} roleKey={roleKey} roleLabel={roleLabel} userName={user?.nom} onLogout={handleLogout} />
        </div>

        {mobileOpen ? (
          <div className="theme-overlay fixed inset-0 z-40 backdrop-blur-sm xl:hidden" onClick={() => setMobileOpen(false)}>
            <div className="h-full w-80" onClick={(event) => event.stopPropagation()}>
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

        <main className="min-w-0 w-full flex-1">
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
          <div className="px-4 py-4 md:px-5 lg:px-6 lg:py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
