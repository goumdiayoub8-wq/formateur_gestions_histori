import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

import Spinner from './components/ui/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
const ChefLayout = lazy(() => import('./layouts/ChefLayout'));
const DirecteurLayout = lazy(() => import('./layouts/DirecteurLayout'));
const FormateurLayout = lazy(() => import('./layouts/FormateurLayout'));
const ProfileRoleLayout = lazy(() => import('./layouts/ProfileRoleLayout'));

const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const DashboardChef = lazy(() => import('./pages/chef/DashboardChef'));
const GestionModules = lazy(() => import('./pages/chef/GestionModules'));
const GestionFormateurs = lazy(() => import('./pages/chef/GestionFormateurs'));
const NotificationsChef = lazy(() => import('./pages/chef/NotificationsChef'));
const AffectationsChef = lazy(() => import('./pages/chef/AffectationsChef'));
const PlanningChef = lazy(() => import('./pages/chef/PlanningChef'));
const RapportsChef = lazy(() => import('./pages/chef/RapportsChef'));
const ParametresChef = lazy(() => import('./pages/chef/ParametresChef'));
const DashboardDirecteur = lazy(() => import('./pages/directeur/DashboardDirecteur'));
const ValidationPlanningDirecteur = lazy(() => import('./pages/directeur/ValidationPlanningDirecteur'));
const ProgressionModulesDirecteur = lazy(() => import('./pages/directeur/ProgressionModulesDirecteur'));
const Rapports = lazy(() => import('./pages/directeur/Rapports'));
const AcademicConfigPage = lazy(() => import('./pages/directeur/AcademicConfigPage'));
const DashboardFormateur = lazy(() => import('./pages/formateur/DashboardFormateur'));
const MesModulesPage = lazy(() => import('./pages/formateur/MesModulesPage'));
const MonPlanning = lazy(() => import('./pages/formateur/MonPlanning'));
const MesDemandes = lazy(() => import('./pages/formateur/MesDemandes'));
const NotificationsFormateur = lazy(() => import('./pages/formateur/NotificationsFormateur'));
const QuestionnaireEvaluationPage = lazy(() => import('./pages/formateur/QuestionnaireEvaluationPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

function RouteFallback() {
  return (
    <div className="theme-page-shell flex min-h-screen items-center justify-center">
      <Spinner className="h-10 w-10 border-slate-300 border-t-teal-500" />
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

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
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
            <Route element={<FormateurLayout />}>
              <Route path="/formateur" element={<DashboardFormateur />} />
              <Route path="/formateur/planning" element={<MonPlanning />} />
              <Route path="/formateur/modules" element={<MesModulesPage />} />
              <Route path="/formateur/questionnaire" element={<QuestionnaireEvaluationPage />} />
              <Route path="/formateur/demande" element={<MesDemandes />} />
              <Route path="/formateur/notifications" element={<NotificationsFormateur />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRole={2} />}>
            <Route element={<ChefLayout />}>
              <Route path="/chef" element={<DashboardChef />} />
              <Route path="/chef/modules" element={<GestionModules />} />
              <Route path="/chef/formateurs" element={<GestionFormateurs />} />
              <Route path="/chef/affectations" element={<AffectationsChef />} />
              <Route path="/chef/planning" element={<PlanningChef />} />
              <Route path="/chef/rapports" element={<RapportsChef />} />
              <Route path="/chef/parametrage" element={<ParametresChef />} />
              <Route path="/chef/notifications" element={<NotificationsChef />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRole={1} />}>
            <Route element={<DirecteurLayout />}>
              <Route path="/directeur" element={<DashboardDirecteur />} />
              <Route path="/directeur/validation-planning" element={<ValidationPlanningDirecteur />} />
              <Route path="/directeur/progression-modules" element={<ProgressionModulesDirecteur />} />
              <Route path="/directeur/academic-config" element={<AcademicConfigPage />} />
              <Route path="/directeur/rapports" element={<Rapports />} />
            </Route>
          </Route>

          <Route path="*" element={<RedirectByRole user={user} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
