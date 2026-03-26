import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Lock, Mail, Save, ShieldCheck, Upload, User, UserCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import AuthService from '../../services/authService';
import { checkAuth } from '../../store/slices/authSlice';
import { roleFromId } from '../../utils/authRoles';

const MAX_PHOTO_SIZE = 1024 * 1024 * 2;

function buildInitials(name) {
  if (!name) {
    return 'AD';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('');
}

function Notice({ notice }) {
  if (!notice?.message) {
    return null;
  }

  const toneClasses =
    notice.tone === 'success'
      ? 'border-[#cae7d3] bg-[#edf9f1] text-[#18794e]'
      : 'border-[#f5cfcf] bg-[#fff2f2] text-[#bf3d3d]';

  return (
    <div className={`rounded-[18px] border px-4 py-3 text-sm font-medium shadow-sm ${toneClasses}`}>
      {notice.message}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#2b3546]">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#eef5ff] text-[#2a73ff]">
          <Icon className="h-4 w-4" />
        </span>
        <span>{label}</span>
      </div>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`h-[58px] w-full rounded-[16px] border border-[#d9e1ec] bg-white px-4 text-[17px] text-[#24334f] outline-none transition placeholder:text-[#9aa7bc] focus:border-[#6aa2ff] focus:ring-4 focus:ring-[#dcebff] ${props.className || ''}`}
    />
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState({ tone: '', message: '' });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    username: '',
    photo: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await AuthService.check();
        const currentUser = response?.user || null;

        if (!currentUser) {
          navigate('/', { replace: true });
          return;
        }

        if (mounted) {
          setProfileForm({
            name: currentUser.nom || '',
            email: currentUser.email || '',
            username: currentUser.username || (currentUser.email?.split('@')[0] || ''),
            photo: currentUser.photo || '',
          });
          setNotice({ tone: '', message: '' });
        }
      } catch (error) {
        if (mounted) {
          navigate('/', { replace: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const roleLabel = useMemo(() => roleFromId(user?.role_id).label, [user?.role_id]);
  const photoPreview = profileForm.photo || '';
  const initials = buildInitials(profileForm.name || user?.nom);

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setNotice({ tone: 'error', message: 'Veuillez choisir une image valide pour la photo de profil.' });
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setNotice({ tone: 'error', message: 'La photo depasse la taille maximale autorisee de 2 Mo.' });
      return;
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Lecture impossible'));
        reader.readAsDataURL(file);
      });

      setProfileForm((current) => ({
        ...current,
        photo: typeof result === 'string' ? result : current.photo,
      }));
      setNotice({ tone: '', message: '' });
    } catch (error) {
      setNotice({ tone: 'error', message: "L'import de la photo a echoue. L'ancien avatar reste utilise." });
    } finally {
      event.target.value = '';
    }
  };

  const refreshSession = async () => {
    await dispatch(checkAuth());
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setNotice({ tone: '', message: '' });

    try {
      const response = await AuthService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        username: profileForm.username,
        photo: profileForm.photo,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      const currentUser = response?.user || null;

      if (currentUser) {
        setProfileForm({
          name: currentUser.nom || '',
          email: currentUser.email || '',
          username: currentUser.username || '',
          photo: currentUser.photo || '',
        });
      }

      await refreshSession();
      setNotice({ tone: 'success', message: response?.message || 'Les informations du profil ont ete mises a jour.' });
    } catch (error) {
      setNotice({ tone: 'error', message: error.message || 'La mise a jour du profil a echoue.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setNotice({ tone: '', message: '' });

    try {
      const response = await AuthService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        username: profileForm.username,
        photo: profileForm.photo,
        ...passwordForm,
      });

      await refreshSession();
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setNotice({ tone: 'success', message: response?.message || 'Le mot de passe a ete modifie avec succes.' });
    } catch (error) {
      setNotice({ tone: 'error', message: error.message || 'La modification du mot de passe a echoue.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#d9e9ff]">
        <div className="flex items-center gap-3 rounded-[22px] bg-white px-5 py-4 shadow-[0_18px_36px_rgba(45,88,160,0.12)]">
          <Spinner className="h-7 w-7 border-[#cad7ea] border-t-[#2b73ff]" />
          <span className="text-sm font-semibold text-[#31425f]">Chargement du profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#d9e9ff] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1540px] space-y-7">
        <div className="space-y-2">
          <h1 className="text-[54px] font-semibold tracking-[-0.03em] text-[#202938] md:text-[60px]">Parametres</h1>
          <p className="text-[17px] text-[#64748b]">Configuration du systeme et preferences utilisateur</p>
        </div>

        <Notice notice={notice} />

        <form
          onSubmit={handleProfileSubmit}
          className="rounded-[28px] border border-[#d7e2ee] bg-white px-6 py-7 shadow-[0_18px_40px_rgba(44,85,156,0.14)] md:px-7"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ecf4ff] text-[#1e68ff]">
                <UserCircle2 className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-[20px] font-semibold text-[#202938]">Profil Utilisateur</h2>
                <p className="text-sm text-[#76859b]">Mettez a jour vos informations de connexion et votre avatar.</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#2a73ff]">
              <ShieldCheck className="h-4 w-4" />
              {roleLabel}
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Field label="Nom Complet" icon={User}>
              <TextInput
                type="text"
                value={profileForm.name}
                onChange={(event) => handleProfileChange('name', event.target.value)}
                placeholder="Nom complet"
                required
              />
            </Field>

            <Field label="Email" icon={Mail}>
              <TextInput
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
                placeholder="Adresse email"
                required
              />
            </Field>

            <Field label="Nom d'utilisateur" icon={UserCircle2}>
              <TextInput
                type="text"
                value={profileForm.username}
                onChange={(event) => handleProfileChange('username', event.target.value)}
                placeholder="Nom d'utilisateur"
                required
              />
            </Field>

            <Field label="Photo de profil" icon={Camera}>
              <div className="flex min-h-[58px] items-center justify-between gap-4 rounded-[16px] border border-[#d9e1ec] bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {photoPreview ? (
                    <img src={photoPreview} alt={profileForm.name || 'Profil'} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-lg font-semibold text-[#2a73ff]">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#24334f]">{profileForm.name || 'Utilisateur'}</p>
                    <p className="truncate text-xs text-[#8b99ad]">{profileForm.email || 'Aucune photo importee'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-[14px] bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#2a73ff] transition hover:bg-[#e2edff]"
                >
                  <Upload className="h-4 w-4" />
                  Choisir
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
              </div>
            </Field>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex h-[54px] items-center gap-2 rounded-[14px] bg-[#0f7aea] px-6 text-[16px] font-semibold text-white shadow-[0_14px_28px_rgba(15,122,234,0.28)] transition hover:bg-[#0c6ed4] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <Save className="h-4 w-4" />}
              Enregistrer les Modifications
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-[28px] border border-[#d7e2ee] bg-white px-6 py-7 shadow-[0_18px_40px_rgba(44,85,156,0.14)] md:px-7"
        >
          <div className="mb-7 flex items-center gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fff0f0] text-[#ef4444]">
              <Lock className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-[20px] font-semibold text-[#202938]">Securite</h2>
              <p className="text-sm text-[#76859b]">Changez votre mot de passe sans modifier le reste de votre profil.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Field label="Mot de Passe Actuel" icon={Lock}>
              <TextInput
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => handlePasswordChange('current_password', event.target.value)}
                placeholder="Votre mot de passe actuel"
                autoComplete="current-password"
              />
            </Field>

            <Field label="Nouveau Mot de Passe" icon={Lock}>
              <TextInput
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => handlePasswordChange('new_password', event.target.value)}
                placeholder="Nouveau mot de passe"
                autoComplete="new-password"
              />
            </Field>

            <div className="xl:col-span-2">
              <Field label="Confirmer le Nouveau Mot de Passe" icon={Lock}>
                <TextInput
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(event) => handlePasswordChange('confirm_password', event.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex h-[54px] items-center gap-2 rounded-[14px] bg-[#ef4444] px-6 text-[16px] font-semibold text-white shadow-[0_14px_28px_rgba(239,68,68,0.24)] transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingPassword ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : <Lock className="h-4 w-4" />}
              Changer le Mot de Passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
