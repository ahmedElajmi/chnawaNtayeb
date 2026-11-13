import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, Loader2, AlertCircle } from 'lucide-react';
import type { PatronLoginError } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { TranslationDictionary } from '@/shared/i18n/translations';
import { ModalShell } from '@/shared/ui/ModalShell';

/** Text of a failed patron sign-in, in the current language (the gateway only gives a code). */
const PATRON_LOGIN_ERRORS: Record<PatronLoginError, keyof TranslationDictionary> = {
  unreachable: 'patronErrorUnreachable',
  invalid: 'patronErrorInvalid',
  'too-many-attempts': 'errorTooManyAttempts',
  unavailable: 'patronErrorUnavailable',
};

interface PatronLoginModalProps {
  isOpen: boolean;
  /** Cancel (a successful login signs the patron in: the backoffice replaces this form) */
  onClose: () => void;
}

export const PatronLoginModal: React.FC<PatronLoginModalProps> = ({ isOpen, onClose }) => {
  const { patron } = useContainer();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PatronLoginError | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // The server is the only judge: there is no client-side fallback
    const result = await patron.login(username, password);
    setIsLoading(false);

    if (result.ok) {
      setPassword('');
    } else {
      setError(result.error);
    }
  };

  return (
    <ModalShell onDismiss={onClose} backdropClassName="bg-black/70">
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-line p-6 shadow-2xl text-ink">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent text-on-accent flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">{t.patronLoginTitle}</h3>
              <p className="text-[11px] text-slate-400">{t.patronLoginSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.settingsClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{t[PATRON_LOGIN_ERRORS[error]]}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.patronLoginUsername}</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accountPassword}</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 rounded-xl bg-accent text-on-accent font-bold text-sm hover:bg-accent-strong transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t.patronLoginSubmit}</span>
          </button>
        </form>
      </div>
    </ModalShell>
  );
};
