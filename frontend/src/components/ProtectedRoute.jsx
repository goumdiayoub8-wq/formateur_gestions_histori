import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './ui/Spinner';

export default function ProtectedRoute({ allowedRole }) {
  const { initialized, loading, user } = useSelector((state) => state.auth);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Spinner className="h-10 w-10 border-slate-300 border-t-teal-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role_id !== allowedRole) {
    if (user.role_id === 1) {
      return <Navigate to="/directeur" replace />;
    }

    if (user.role_id === 2) {
      return <Navigate to="/chef" replace />;
    }

    return <Navigate to="/formateur" replace />;
  }

  return <Outlet />;
}
