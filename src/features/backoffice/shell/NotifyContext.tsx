import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { Notify } from '../useCatalogAdmin';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

const ERRORS: Record<string, (b: BackofficeTexts) => string> = {
  'err:conflict': (b) => b.errConflict,
  'err:denied': (b) => b.errDenied,
  'err:not-found': (b) => b.errNotFound,
  'err:unknown-cell': (b) => b.errUnknownCell,
  'err:incomplete-cell': (b) => b.errIncompleteCell,
  'err:note-required': (b) => b.errNoteRequired,
  'err:not-publishable': (b) => b.errNotPublishable,
  'err:saved-locally': (b) => b.errSavedLocally,
  'err:write-refused': (b) => b.errWriteRefused,
  'err:unreachable': (b) => b.errUnreachable,
  'err:invalid-email': (b) => b.errInvalidEmail,
  'err:admin-role': (b) => b.errAdminRole,
  'err:unknown-role': (b) => b.errUnknownRole,
  'err:no-account': (b) => b.errNoAccount,
};

/** A message in the current language: error codes of the stores (`err:…`) are translated, anywhere in it. */
export function translateMessage(b: BackofficeTexts, message: string): string {
  return message.replace(/err:[a-z-]+/g, (code) => ERRORS[code]?.(b) ?? code);
}

const NotifyContext = createContext<Notify | null>(null);

/**
 * Short messages of the backoffice ("Recette enregistrée", errors), shared by every page:
 * a page calls useNotify() instead of receiving a notify prop.
 */
export function NotifyProvider({ children }: { children: ReactNode }) {
  const b = useBackofficeText();
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback<Notify>((message, isError = false) => {
    setToast({ message, isError });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), isError ? 6000 : 3500);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          role={toast.isError ? 'alert' : 'status'}
          className={`fixed top-20 inset-x-4 sm:inset-x-auto sm:end-4 sm:max-w-sm z-50 p-3 rounded-xl text-xs font-bold shadow-xl flex items-start gap-2 animate-fade-in ${
            toast.isError ? 'bg-rose-600 text-white' : 'bg-brand text-on-brand'
          }`}
        >
          {toast.isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 stroke-[3] shrink-0" />
          )}
          <span>{translateMessage(b, toast.message)}</span>
        </div>
      )}
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NotifyContext);
  if (!notify) throw new Error('useNotify must be used inside NotifyProvider');
  return notify;
}
