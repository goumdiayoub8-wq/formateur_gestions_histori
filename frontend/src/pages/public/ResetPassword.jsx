import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import AuthButton from '../../components/auth/AuthButton';
import AuthInput from '../../components/auth/AuthInput';
import AuthShell from '../../components/auth/AuthShell';
import AuthToast from '../../components/auth/AuthToast';
import AuthService from '../../services/authService';

function validatePasswords(password, confirmPassword) {
  const errors = {};

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    const errors = validatePasswords(password, confirmPassword);
    setFieldErrors(errors);

    if (!token) {
      setToast({ type: 'error', message: 'Le token de reinitialisation est manquant.' });
      return;
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });

      setToast({ type: 'success', message: 'Mot de passe reinitialise. Redirection vers la connexion...' });
      window.setTimeout(() => navigate('/'), 1200);
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message || 'Reinitialisation impossible.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthToast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'success', message: '' })} />

      <AuthShell title="Reinitialisation" subtitle="Choisissez un nouveau mot de passe">
        <form onSubmit={handleSubmit} className="space-y-8">
          <AuthInput
            id="reset-password"
            label="Nouveau mot de passe"
            type="password"
            value={password}
            placeholder="Entrez votre nouveau mot de passe"
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
            id="reset-confirm-password"
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            placeholder="Confirmez votre nouveau mot de passe"
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

          <AuthButton type="submit" loading={loading} disabled={!password || !confirmPassword}>
            {loading ? 'Validation...' : 'Mettre a jour le mot de passe'}
          </AuthButton>

          <p className="text-center text-[15px] text-[#7b8aa2]">
            <Link to="/" className="font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]">
              Retour a la connexion
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
