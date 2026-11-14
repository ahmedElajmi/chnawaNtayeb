import React, { useEffect, useMemo, useState } from 'react';
import { User, LogIn, LogOut, CheckCircle, Sparkles, X, Mail, Loader2, UserPlus, Pencil, KeyRound } from 'lucide-react';
import type { AppUser, PasswordCriteria, UserAuthError } from '@/application';
import { useAccountProfile, useContainer, useCountries } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { LANGUAGES, type Language } from '@/core/shared';
import { validateRegistration, type Address, type FieldError } from '@/core/accounts';
import type { TranslationDictionary } from '@/shared/i18n/translations';
import { ModalShell } from '@/shared/ui/ModalShell';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { AddressFields } from '@/shared/ui/AddressFields';
import { PasswordInput, passwordScore } from '@/shared/ui/PasswordInput';

/** Text of a failed sign-in, in the current language (the gateway only gives a code). */
function authErrorText(t: TranslationDictionary, error: UserAuthError, minPasswordLength: number): string {
  switch (error) {
    case 'invalid-credentials':
      return t.authErrorInvalidCredentials;
    case 'email-in-use':
      return t.authErrorEmailInUse;
    case 'weak-password':
      return t.authErrorWeakPassword.replace('{n}', String(minPasswordLength));
    case 'invalid-email':
      return t.authErrorInvalidEmail;
    case 'too-many-attempts':
      return t.errorTooManyAttempts;
    case 'locked':
      return t.authErrorLocked;
    case 'network':
      return t.errorNetwork;
    case 'disabled':
      return t.authErrorDisabled;
    default:
      return t.authErrorUnknown;
  }
}

/** One field-level error message, in the current language. */
function fieldErrorText(t: TranslationDictionary, error: FieldError): string {
  const keyOf: Record<FieldError['message'], keyof TranslationDictionary> = {
    required: 'accountFieldRequired',
    email: 'accountEmail',
    'password-length': 'accountPasswordMin',
    phone: 'accountFieldPhone',
    address: 'accountFieldAddress',
    language: 'accountFieldLanguage',
    'name-length': 'accountNamePlaceholder',
  };
  return String(t[keyOf[error.message]]);
}

const EMPTY_ADDRESS: Address = { line: '', region: '', city: '', postalCode: '', country: 'TN' };

const DEFAULT_CRITERIA: PasswordCriteria = { minLength: 8, digit: false, uppercase: false, special: false };

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({ isOpen, onClose, currentUser }) => {
  const { userAuth } = useContainer();
  const { profile: accountProfile, accountProfileStore } = useAccountProfile();
  const { countries: allCountries, enabled } = useCountries();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Registration extras (all optional except the name)
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [withAddress, setWithAddress] = useState(false);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(language);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  // Sign-in and sign-up are two explicit actions: a wrong password never creates an account
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // A guest keeps its session and opens the form over it (registering replaces it server-side)
  const [formOpen, setFormOpen] = useState(false);
  // Live password rules of the site (the backoffice configures them)
  const [criteria, setCriteria] = useState<PasswordCriteria>(DEFAULT_CRITERIA);
  // Profile editing (signed-in accounts)
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (savedNote) {
      const timer = setTimeout(() => setSavedNote(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [savedNote]);

  // The live criteria back the rules shown in the forms (min length, character classes)
  useEffect(() => {
    if (!isOpen) return;
    userAuth
      .passwordCriteria()
      .then(setCriteria)
      .catch(() => undefined);
  }, [isOpen, userAuth]);

  // The form state resets when the modal leaves: the next opening starts from the profile
  const dismiss = () => {
    setFormOpen(false);
    onClose();
  };

  const addressErrors = useMemo(() => new Set(fieldErrors.map((e) => e.field)), [fieldErrors]);

  if (!isOpen) return null;

  const eyeLabels = { show: t.accountPasswordShow, hide: t.accountPasswordHide };
  const showError = (err: unknown) => setErrorMsg(authErrorText(t, userAuth.errorCode(err), criteria.minLength));

  // Strength of a password: every active rule counts (length, then the character classes)
  const strengthOf = (value: string): { level: 0 | 1 | 2 | 3; label: string } => {
    const activeRules = 1 + (criteria.digit ? 1 : 0) + (criteria.uppercase ? 1 : 0) + (criteria.special ? 1 : 0);
    const ratio = passwordScore(value, criteria) / activeRules;
    const level = ratio >= 1 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
    const labels = [t.passwordStrengthWeak, t.passwordStrengthFair, t.passwordStrengthGood, t.passwordStrengthStrong];
    return { level, label: labels[level] };
  };
  const STRENGTH_COLORS = ['bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-600'];
  const strengthBar = (value: string) => {
    const { level, label } = strengthOf(value);
    return (
      <div className="mt-1.5" aria-live="polite">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= level ? STRENGTH_COLORS[level] : 'bg-slate-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-ink-muted mt-0.5">{label}</p>
      </div>
    );
  };
  const criteriaHints = (
    <ul className="text-[10px] text-ink-muted mt-1 space-y-0.5">
      {criteria.digit && <li>• {t.accountPasswordRuleDigit}</li>}
      {criteria.uppercase && <li>• {t.accountPasswordRuleUpper}</li>}
      {criteria.special && <li>• {t.accountPasswordRuleSpecial}</li>}
    </ul>
  );

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors([]);
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg(t.accountPasswordMismatch);
        return;
      }
      const input = {
        email,
        password,
        displayName: displayName || undefined,
        phone: phone || undefined,
        address: withAddress ? address : undefined,
        preferredLanguage,
      };
      const errors = validateRegistration(input, enabled, criteria.minLength);
      if (errors.length) {
        setFieldErrors(errors);
        return;
      }
    }
    setIsLoading(true);
    try {
      if (mode === 'register') {
        await userAuth.register({
          email,
          password,
          displayName: displayName || undefined,
          phone: phone || undefined,
          address: withAddress ? address : undefined,
          preferredLanguage,
        });
        await setLanguage(preferredLanguage);
      } else await userAuth.loginWithEmail(email, password);
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await userAuth.loginAsGuest();
      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await userAuth.logout();
      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFieldErrors([]);
    setSavingProfile(true);
    try {
      const result = await accountProfileStore.update(currentUser.uid, {
        displayName,
        phone,
        address: withAddress ? address : undefined,
        preferredLanguage,
      });
      if (!result.ok) setFieldErrors(result.errors);
      else {
        setEditing(false);
        setSavedNote(true);
        if (preferredLanguage !== language) void setLanguage(preferredLanguage);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const changeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    if (newPassword !== confirmNewPassword) {
      setErrorMsg(t.accountPasswordMismatch);
      return;
    }
    setIsLoading(true);
    try {
      await userAuth.changePassword(currentPassword, newPassword);
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSavedNote(true);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdminSession = !!currentUser && userAuth.isSuperAdminAccount(currentUser);
  // Admin gate: the super-admin session, or an account that is a member of the team
  const isAdmin = isSuperAdminSession || (!!currentUser && accountProfile?.type === 'employee');
  const profile = accountProfile ?? null;
  const realAccount = !!currentUser && !currentUser.isAnonymous && !isSuperAdminSession;
  const isGuest = !!currentUser && currentUser.isAnonymous && !isSuperAdminSession;
  // Guests see an invitation to create an account over their session; the others see their profile
  const showAuthForm = !currentUser || formOpen;
  const roleLabel = isSuperAdminSession
    ? t.accountRoleAdmin
    : isAdmin
      ? t.accountRoleEmployee
      : isGuest
        ? t.accountGuest
        : t.accountRoleUser;

  return (
    <ModalShell onDismiss={dismiss}>
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-line p-6 shadow-2xl text-ink">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-md">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">{currentUser ? t.accountMine : t.accountSpace}</h3>
              <p className="text-[11px] text-slate-400">{currentUser ? t.accountSynced : t.accountSaveFavorites}</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label={t.settingsClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
            {errorMsg}
          </div>
        )}
        {savedNote && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            {t.accountSaved}
          </div>
        )}

        {showAuthForm ? (
          <div className="mt-4 space-y-4">
            {/* Guests keep their session: the banner says what stays on the device and invites to sign up */}
            {isGuest && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>{t.accountGuestBanner}</span>
              </div>
            )}
            <div role="tablist" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-card border border-line">
              {(
                [
                  ['login', t.accountSignIn],
                  ['register', t.accountCreate],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => {
                    setMode(id);
                    setErrorMsg(null);
                    setFieldErrors([]);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    mode === id ? 'bg-brand text-on-brand' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accountEmail}</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.accountEmailPlaceholder}
                    autoComplete="email"
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${addressErrors.has('email') ? ' border-rose-400' : ''}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accountPassword}</label>
                <div className="mt-1">
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    minLength={mode === 'register' ? criteria.minLength : undefined}
                    ariaLabel={t.accountPassword}
                    toggleLabels={eyeLabels}
                  />
                </div>
                {mode === 'register' && password && strengthBar(password)}
                {mode === 'register' && (
                  <p className="text-[10px] text-ink-muted mt-1">
                    {t.accountPasswordMin.replace('{n}', String(criteria.minLength))}
                  </p>
                )}
                {mode === 'register' && criteriaHints}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.accountPasswordConfirm}
                  </label>
                  <div className="mt-1">
                    <PasswordInput
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      ariaLabel={t.accountPasswordConfirm}
                      toggleLabels={eyeLabels}
                      className={confirmPassword && confirmPassword !== password ? 'border-rose-400' : ''}
                    />
                  </div>
                </div>
              )}

              {/* Registration extras: name, phone, optional address, preferred language */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accountName}</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t.accountNamePlaceholder}
                      maxLength={60}
                      className={`mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${addressErrors.has('displayName') ? ' border-rose-400' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.accountPhone} <span className="font-normal text-slate-400">{t.accountPhoneOptional}</span>
                    </label>
                    <div className="mt-1">
                      <PhoneInput value={phone} onChange={setPhone} options={allCountries} language={language} />
                    </div>
                    {addressErrors.has('phone') && (
                      <p className="mt-1 text-[10px] text-rose-600">{t.accountFieldPhone}</p>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !withAddress;
                        setWithAddress(next);
                        if (next && !address.line && !address.city)
                          setAddress({ ...EMPTY_ADDRESS, country: enabled[0]?.id ?? 'TN' });
                      }}
                      className="text-xs font-bold text-accent-text hover:underline"
                    >
                      {withAddress ? t.accountAddressTitle : t.accountAddressAdd}
                    </button>
                    {withAddress && (
                      <div className="mt-2">
                        <AddressFields
                          address={address}
                          onChange={setAddress}
                          countries={enabled}
                          language={language}
                          errors={addressErrors}
                          placeholders={{
                            line: t.accountAddressLine,
                            region: t.accountAddressRegion,
                            city: t.accountAddressCity,
                            postal: t.accountAddressPostal,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.accountPreferredLanguage}
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                      className="mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.selectorLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-brand text-on-brand font-bold text-xs sm:text-sm hover:bg-brand-strong transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'register' ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{mode === 'register' ? t.accountCreateMine : t.accountSignIn}</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-surface px-2 text-[10px] text-slate-400 font-semibold uppercase">{t.accountOr}</span>
            </div>

            {!isGuest && (
              <button
                onClick={handleGuestAuth}
                disabled={isLoading}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-card text-slate-700 dark:text-slate-200 font-semibold text-xs hover:border-brand transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t.accountGuestContinue}</span>
              </button>
            )}
          </div>
        ) : isGuest ? (
          /* Guest panel: honest state, no fake account — the data stay on this device */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.accountStatus}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.accountGuest}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{t.accountGuestBanner}</p>
            </div>
            <button
              onClick={() => {
                setMode('register');
                setFormOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-brand text-on-brand font-bold text-xs sm:text-sm hover:bg-brand-strong transition flex items-center justify-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.accountCreateMine}</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{t.accountSignOut}</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.accountStatus}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t.accountConnected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.accountIdentifier}</span>
                <span className="text-xs font-bold text-ink truncate max-w-[180px]">
                  {isSuperAdminSession ? t.accountBackofficeSession : (currentUser.email ?? '')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.accountRole}</span>
                <span className="text-xs font-extrabold text-accent-text uppercase">{roleLabel}</span>
              </div>
            </div>

            {/* Profile of a real account: view, then edit (guests and superAdmin sessions have no profile) */}
            {realAccount && !editing && (
              <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{t.accountProfileTitle}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(profile?.displayName ?? '');
                      setPhone(profile?.phone ?? '');
                      setAddress(profile?.address ?? EMPTY_ADDRESS);
                      setWithAddress(!!profile?.address);
                      setPreferredLanguage((profile?.preferredLanguage as Language | undefined) ?? language);
                      setEditing(true);
                    }}
                    className="text-xs font-bold text-accent-text inline-flex items-center gap-1 hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    {t.accountEditProfile}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{profile?.displayName ?? t.accountProfileUnavailable}</p>
                {profile?.phone && (
                  <p className="text-xs text-slate-500" dir="ltr">
                    {profile.phone}
                  </p>
                )}
                {profile?.address && (
                  <p className="text-xs text-slate-500 truncate">
                    {[profile.address.line, profile.address.city].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}

            {realAccount && editing && (
              <form
                onSubmit={saveProfile}
                className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.accountName}
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.accountNamePlaceholder}
                    maxLength={60}
                    className={`mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${addressErrors.has('displayName') ? ' border-rose-400' : ''}`}
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.accountPhone} <span className="font-normal text-slate-400">{t.accountPhoneOptional}</span>
                  <div className="mt-1">
                    <PhoneInput value={phone} onChange={setPhone} options={allCountries} language={language} />
                  </div>
                  {addressErrors.has('phone') && (
                    <p className="mt-1 text-[10px] text-rose-600">{t.accountFieldPhone}</p>
                  )}
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !withAddress;
                      setWithAddress(next);
                      if (next && !address.line && !address.city)
                        setAddress({ ...EMPTY_ADDRESS, country: enabled[0]?.id ?? 'TN' });
                    }}
                    className="text-xs font-bold text-accent-text hover:underline"
                  >
                    {withAddress ? t.accountAddressTitle : t.accountAddressAdd}
                  </button>
                  {withAddress && (
                    <div className="mt-2">
                      <AddressFields
                        address={address}
                        onChange={setAddress}
                        countries={enabled}
                        language={language}
                        errors={addressErrors}
                        placeholders={{
                          line: t.accountAddressLine,
                          region: t.accountAddressRegion,
                          city: t.accountAddressCity,
                          postal: t.accountAddressPostal,
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.accountPreferredLanguage}
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                    className={`mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${addressErrors.has('preferredLanguage') ? ' border-rose-400' : ''}`}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.selectorLabel}
                      </option>
                    ))}
                  </select>
                </label>
                {fieldErrors.length > 0 && !fieldErrors.every((e) => e.field.startsWith('address.')) && (
                  <p className="text-[10px] text-rose-600">{fieldErrorText(t, fieldErrors[0])}</p>
                )}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2 rounded-xl bg-brand text-on-brand font-bold text-xs hover:bg-brand-strong transition disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t.boSave}
                </button>
              </form>
            )}

            {/* Password change, for real accounts only */}
            {realAccount && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setChangingPassword((v) => !v)}
                  className="text-xs font-bold text-slate-500 hover:text-ink inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  {t.accountChangePassword}
                </button>
                {changingPassword && (
                  <form onSubmit={changeMyPassword} className="mt-2 space-y-2 text-left">
                    <PasswordInput
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      placeholder={t.accountCurrentPassword}
                      autoComplete="current-password"
                      required
                      ariaLabel={t.accountCurrentPassword}
                      toggleLabels={eyeLabels}
                    />
                    <PasswordInput
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder={t.accountNewPassword}
                      autoComplete="new-password"
                      minLength={criteria.minLength}
                      required
                      ariaLabel={t.accountNewPassword}
                      toggleLabels={eyeLabels}
                    />
                    {newPassword && strengthBar(newPassword)}
                    {newPassword && criteriaHints}
                    <PasswordInput
                      value={confirmNewPassword}
                      onChange={setConfirmNewPassword}
                      placeholder={t.accountPasswordConfirm}
                      autoComplete="new-password"
                      required
                      ariaLabel={t.accountPasswordConfirm}
                      toggleLabels={eyeLabels}
                      className={confirmNewPassword && confirmNewPassword !== newPassword ? 'border-rose-400' : ''}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 rounded-xl bg-brand text-on-brand font-bold text-xs hover:bg-brand-strong transition disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t.accountChangePassword}
                    </button>
                  </form>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">{t.accountActiveNote}</p>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{t.accountSignOut}</span>
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
