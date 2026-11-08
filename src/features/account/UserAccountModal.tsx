import React, { useState } from 'react';
import { User, LogIn, LogOut, CheckCircle, Sparkles, X, Mail, Lock, Shield, Loader2, UserPlus } from 'lucide-react';
import type { AppUser } from '@/application';
import { useContainer } from '@/app/ContainerContext';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onOpenPatronLogin?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPatronLogin,
}) => {
  const { userAuth } = useContainer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Sign-in and sign-up are two explicit actions: a wrong password never creates an account
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (mode === 'register') await userAuth.register(email, password);
      else await userAuth.loginWithEmail(email, password);
      setPassword('');
      onClose();
    } catch (err) {
      setErrorMsg(userAuth.errorMessage(err));
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
      setErrorMsg(userAuth.errorMessage(err));
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
      setErrorMsg(userAuth.errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isPatronSession = !!currentUser && userAuth.isPatronAccount(currentUser);
  const isAdmin = isPatronSession || (!!currentUser && userAuth.isOwner(currentUser));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-line p-6 shadow-2xl text-ink">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-md">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">{currentUser ? 'Mon Compte' : 'Espace Utilisateur'}</h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Synchronisé avec votre compte' : 'Sauvegardez vos favoris'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {currentUser ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Statut :</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Connecté
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Identifiant :</span>
                <span className="text-xs font-bold text-ink truncate max-w-[180px]">
                  {isPatronSession ? 'Session patron' : currentUser.isAnonymous ? 'Invité Gourmand' : currentUser.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Rôle :</span>
                <span className="text-xs font-extrabold text-accent-text uppercase">
                  {isAdmin ? 'Super Admin' : 'Utilisateur'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ton compte est actif. Tes favoris, ton frigo et ton menu de la semaine restent enregistrés sur cet
              appareil.
            </p>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>Se déconnecter</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div role="tablist" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-card border border-line">
              {(
                [
                  ['login', 'Se connecter'],
                  ['register', 'Créer un compte'],
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre-email@exemple.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    minLength={mode === 'register' ? userAuth.minPasswordLength : undefined}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>
                {mode === 'register' && (
                  <p className="text-[10px] text-ink-muted mt-1">{userAuth.minPasswordLength} caractères minimum.</p>
                )}
              </div>

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
                <span>{mode === 'register' ? 'Créer mon compte' : 'Se connecter'}</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-surface px-2 text-[10px] text-slate-400 font-semibold uppercase">Ou</span>
            </div>

            <button
              onClick={handleGuestAuth}
              disabled={isLoading}
              className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-card text-slate-700 dark:text-slate-200 font-semibold text-xs hover:border-brand transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Continuer en 1-clic (Invité)</span>
            </button>
          </div>
        )}

        {/* Discrete hint for admin */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenPatronLogin) onOpenPatronLogin();
            }}
            className="text-[11px] text-slate-400 hover:text-accent-text transition inline-flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>Accès sécurisé gérance (/patron)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
