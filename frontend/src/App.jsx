import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./store/slices/authSlice";

import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import AppErrorBoundary from "./components/app/AppErrorBoundary";
import {
  Skeleton,
  SkeletonChartPanel,
  SkeletonPremiumCard,
} from "./components/ui/Skeleton";
import Login from "./pages/public/Login";
import ChefLayout from "./layouts/ChefLayout";
import DirecteurLayout from "./layouts/DirecteurLayout";
import FormateurLayout from "./layouts/FormateurLayout";
import ProfileRoleLayout from "./layouts/ProfileRoleLayout";
import useTheme from "./theme/useTheme";

const Register = lazy(() => import("./pages/public/Register"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword"));
const DashboardChef = lazy(() => import("./pages/chef/DashboardChef"));
const GestionModules = lazy(() => import("./pages/chef/GestionModules"));
const GestionFormateurs = lazy(() => import("./pages/chef/GestionFormateurs"));
const NotificationsChef = lazy(() => import("./pages/chef/NotificationsChef"));
const AffectationsChef = lazy(() => import("./pages/chef/AffectationsChef"));
const PlanningChef = lazy(() => import("./pages/chef/PlanningChef"));
const RapportsChef = lazy(() => import("./pages/chef/RapportsChef"));
const ParametresChef = lazy(() => import("./pages/chef/ParametresChef"));
const DashboardDirecteur = lazy(
  () => import("./pages/directeur/DashboardDirecteur"),
);
const ValidationPlanningDirecteur = lazy(
  () => import("./pages/directeur/ValidationPlanningDirecteur"),
);
const ProgressionModulesDirecteur = lazy(
  () => import("./pages/directeur/ProgressionModulesDirecteur"),
);
const RapportsDirecteur = lazy(
  () => import("./pages/directeur/RapportsDirecteur"),
);
const AcademicConfigPage = lazy(
  () => import("./pages/directeur/AcademicConfigPage"),
);
const DashboardFormateur = lazy(
  () => import("./pages/formateur/DashboardFormateur"),
);
const MesModulesPage = lazy(() => import("./pages/formateur/MesModulesPage"));
const MonPlanning = lazy(() => import("./pages/formateur/MonPlanning"));
const MesDemandes = lazy(() => import("./pages/formateur/MesDemandes"));
const NotificationsFormateur = lazy(
  () => import("./pages/formateur/NotificationsFormateur"),
);
const QuestionnairePage = lazy(
  () => import("./pages/formateur/QuestionnairePage"),
);
const ProfilePage = lazy(() => import("./pages/shared/ProfilePage"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonPremiumCard key={index} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SkeletonChartPanel className="min-h-[340px]" />
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl">
            <div className="space-y-4">
              <Skeleton className="h-5 w-44 rounded-full" />
              <Skeleton className="h-4 w-64 rounded-full" />
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-4 transition-colors duration-300 dark:border-white/10 dark:bg-transparent"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-20 rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedirectByRole({ user }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role_id === 1) {
    return <Navigate to="/directeur" replace />;
  }

  if (user.role_id === 2) {
    return <Navigate to="/chef" replace />;
  }

  return <Navigate to="/formateur" replace />;
}

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useTheme();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <AppErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<ProfileRoleLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRole={3} />}>
              <Route
                path="/questionnaire/:token"
                element={<QuestionnairePage />}
              />
              <Route element={<FormateurLayout />}>
                <Route path="/formateur" element={<DashboardFormateur />} />
                <Route path="/formateur/planning" element={<MonPlanning />} />
                <Route path="/formateur/modules" element={<MesModulesPage />} />
                <Route path="/formateur/demande" element={<MesDemandes />} />
                <Route
                  path="/formateur/notifications"
                  element={<NotificationsFormateur />}
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRole={2} />}>
              <Route element={<ChefLayout />}>
                <Route path="/chef" element={<DashboardChef />} />
                <Route path="/chef/modules" element={<GestionModules />} />
                <Route
                  path="/chef/formateurs"
                  element={<GestionFormateurs />}
                />
                <Route
                  path="/chef/affectations"
                  element={<AffectationsChef />}
                />
                <Route path="/chef/planning" element={<PlanningChef />} />
                <Route path="/chef/rapports" element={<RapportsChef />} />
                <Route path="/chef/parametrage" element={<ParametresChef />} />
                <Route
                  path="/chef/notifications"
                  element={<NotificationsChef />}
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRole={1} />}>
              <Route element={<DirecteurLayout />}>
                <Route path="/directeur" element={<DashboardDirecteur />} />
                <Route
                  path="/directeur/validation-planning"
                  element={<ValidationPlanningDirecteur />}
                />
                <Route
                  path="/directeur/progression-modules"
                  element={<ProgressionModulesDirecteur />}
                />
                <Route
                  path="/directeur/academic-config"
                  element={<AcademicConfigPage />}
                />
                <Route
                  path="/directeur/rapports"
                  element={<RapportsDirecteur />}
                />
              </Route>
            </Route>

            <Route path="*" element={<RedirectByRole user={user} />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" expand={true} richColors theme={isDark ? "dark" : "light"} />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
