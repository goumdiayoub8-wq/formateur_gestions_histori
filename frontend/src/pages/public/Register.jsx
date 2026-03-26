import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import AuthButton from '../../components/auth/AuthButton';
import AuthInput from '../../components/auth/AuthInput';
import AuthRoleSelector from '../../components/auth/AuthRoleSelector';
import AuthShell from '../../components/auth/AuthShell';
import AuthToast from '../../components/auth/AuthToast';
import AuthService from '../../services/authService';
import { AUTH_ROLE_OPTIONS } from '../../utils/authRoles';

function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Le nom est obligatoire.';
  }

  if (!email.trim()) {
    errors.email = 'L email est obligatoire.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Entrez une adresse email valide.';
  }

  if (!password) {
    errors.password = 'Le mot de passe est obligatoire.';
  } else if (password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caracteres.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'La confirmation est obligatoire.';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'La confirmation ne correspond pas.';
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('formateur');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [loading, setLoading] = useState(false);

  const selectedRoleConfig =
    AUTH_ROLE_OPTIONS.find((role) => role.key === selectedRole) || AUTH_ROLE_OPTIONS[2];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    const nextErrors = validateRegister({ name, email, password, confirmPassword });
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      setToast({ type: 'success', message: '' });

      await AuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        role_id: selectedRoleConfig.roleId,
      });

      setToast({ type: 'success', message: 'Compte cree avec succes. Redirection vers la connexion...' });

      window.setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Inscription impossible.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthToast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'success', message: '' })} />

      <AuthShell title="Inscription" subtitle="Creez votre compte">
        <form onSubmit={handleSubmit} className="space-y-8">
          <AuthRoleSelector
            label="Selectionnez votre role"
            options={AUTH_ROLE_OPTIONS}
            selectedKey={selectedRole}
            onSelect={(option) => setSelectedRole(option.key)}
            hint="Le role choisi sera envoye au backend lors de l inscription."
          />

          <AuthInput
            id="register-name"
            label="Nom complet"
            value={name}
            placeholder="Entrez votre nom"
            icon={User}
            error={fieldErrors.name}
            onChange={(value) => {
              setName(value);
              setFieldErrors((current) => ({ ...current, name: '' }));
            }}
          />

          <AuthInput
            id="register-email"
            label="Email"
            type="email"
            value={email}
            placeholder="Entrez votre email"
            icon={Mail}
            error={fieldErrors.email}
            onChange={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: '' }));
            }}
          />

          <AuthInput
            id="register-password"
            label="Mot de passe"
            type="password"
            value={password}
            placeholder="Choisissez un mot de passe"
            icon={Lock}
            error={fieldErrors.password}
            showToggle
            isPasswordVisible={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: '' }));
            }}
          />

          <AuthInput
            id="register-confirm-password"
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            placeholder="Confirmez votre mot de passe"
            icon={Lock}
            error={fieldErrors.confirmPassword}
            showToggle
            isPasswordVisible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
            onChange={(value) => {
              setConfirmPassword(value);
              setFieldErrors((current) => ({ ...current, confirmPassword: '' }));
            }}
          />

          <AuthButton type="submit" loading={loading} disabled={!name.trim() || !email.trim() || !password || !confirmPassword}>
            {loading ? 'Creation...' : 'Creer un compte'}
          </AuthButton>

          <p className="text-center text-[15px] text-[#7b8aa2]">
            Deja inscrit ?{' '}
            <Link to="/" className="font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]">
              Retour a la connexion
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
