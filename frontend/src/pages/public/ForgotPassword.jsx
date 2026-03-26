import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthButton from '../../components/auth/AuthButton';
import AuthInput from '../../components/auth/AuthInput';
import AuthShell from '../../components/auth/AuthShell';
import AuthToast from '../../components/auth/AuthToast';
import AuthService from '../../services/authService';

function validateEmail(email) {
  if (!email.trim()) {
    return 'L email est obligatoire.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Entrez une adresse email valide.';
  }

  return '';
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    const validationError = validateEmail(email);
    setError(validationError);
    if (validationError) {
      return;
    }

    try {
      setLoading(true);
      await AuthService.forgotPassword(email.trim());
      setToast({ type: 'success', message: 'Si cet email existe, un lien a ete envoye.' });
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message || 'Impossible d envoyer le lien.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthToast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'success', message: '' })} />

      <AuthShell title="Mot de passe oublie" subtitle="Recevez un lien de reinitialisation">
        <form onSubmit={handleSubmit} className="space-y-8">
          <AuthInput
            id="forgot-email"
            label="Email"
            type="email"
            value={email}
            placeholder="Entrez votre email"
            icon={Mail}
            error={error}
            onChange={(value) => {
              setEmail(value);
              setError('');
            }}
          />

          <AuthButton type="submit" loading={loading} disabled={!email.trim()}>
            {loading ? 'Envoi...' : 'Envoyer le lien'}
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
