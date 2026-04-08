import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import AuthButton from '../../components/auth/AuthButton';
import AuthInput from '../../components/auth/AuthInput';
import AuthRoleSelector from '../../components/auth/AuthRoleSelector';
import AuthShell from '../../components/auth/AuthShell';
import AuthToast from '../../components/auth/AuthToast';
import { clearError, login } from '../../store/slices/authSlice';
import {
  clearLoginPreferences,
  getLoginPreferences,
  persistLoginPreferences,
} from '../../utils/authStorage';
import { AUTH_ROLE_OPTIONS } from '../../utils/authRoles';

function redirectByRole(navigate, roleId) {
  if (roleId === 1) {
    navigate('/directeur');
    return;
  }

  if (roleId === 2) {
    navigate('/chef');
    return;
  }

  navigate('/formateur');
}

function validateLogin({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'L email est obligatoire.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Entrez une adresse email valide.';
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  }

  return errors;
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const remembered = useMemo(() => getLoginPreferences(), []);

  const [selectedRole, setSelectedRole] = useState(remembered.role || 'administration');
  const [email, setEmail] = useState(remembered.email || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(remembered.rememberMe));
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [helperMessage, setHelperMessage] = useState('');

  useEffect(() => {
    if (user?.role_id) {
      redirectByRole(navigate, user.role_id);
    }
  }, [navigate, user]);

  const selectedRoleConfig =
    AUTH_ROLE_OPTIONS.find((role) => role.key === selectedRole) || AUTH_ROLE_OPTIONS[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    const nextErrors = validateLogin({ email, password });
    setFieldErrors(nextErrors);
    setHelperMessage('');
    dispatch(clearError());

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        login({
          email: email.trim(),
          password,
          expectedRole: selectedRoleConfig.roleId,
        }),
      ).unwrap();

      if (rememberMe) {
        persistLoginPreferences({
          rememberMe: true,
          email: email.trim(),
          role: selectedRole,
        });
      } else {
        clearLoginPreferences();
      }
    } catch (loginError) {
      setHelperMessage(typeof loginError === 'string' ? loginError : '');
    }
  };

  return (
    <>
      <AuthToast type={error ? 'error' : 'success'} message={error || helperMessage} onClose={() => {
        if (error) {
          dispatch(clearError());
        } else {
          setHelperMessage('');
        }
      }} />

      <AuthShell title="Bienvenue" subtitle="Connectez-vous a votre espace">
        <form onSubmit={handleSubmit} className="space-y-8">
          <AuthRoleSelector
            label="Selectionnez votre role"
            options={AUTH_ROLE_OPTIONS}
            selectedKey={selectedRole}
            showTestAccounts
            hint="Cliquez sur un role pour remplir automatiquement le compte test correspondant."
            onSelect={(option) => {
              setSelectedRole(option.key);
              setEmail(option.testAccount.email);
              setPassword(option.testAccount.password);
              setRememberMe(true);
              setFieldErrors({});
              dispatch(clearError());
              setHelperMessage('');
            }}
          />

          <AuthInput
            id="login-email"
            label="Email / Identifiant"
            type="email"
            value={email}
            placeholder="Entrez votre email"
            icon={Mail}
            error={fieldErrors.email}
            onChange={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: '' }));
              dispatch(clearError());
              setHelperMessage('');
            }}
          />

          <AuthInput
            id="login-password"
            label="Mot de passe"
            type="password"
            value={password}
            placeholder="Entrez votre mot de passe"
            icon={Lock}
            error={fieldErrors.password}
            showToggle
            isPasswordVisible={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: '' }));
              dispatch(clearError());
              setHelperMessage('');
            }}
          />

          <div className="theme-text-muted flex flex-col gap-4 text-[15px] sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-5 w-5 rounded border-[color:var(--color-border-strong)] text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]"
              />
              <span>Se souvenir de moi</span>
            </label>

            <Link to="/forgot-password" className="font-medium text-[color:var(--color-primary)] transition hover:brightness-110">
              Mot de passe oublie ?
            </Link>
          </div>

          <AuthButton type="submit" loading={loading} disabled={!email.trim() || !password}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </AuthButton>

          <p className="theme-text-muted text-center text-[15px]">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-[color:var(--color-primary)] transition hover:brightness-110">
              Creer un compte
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
