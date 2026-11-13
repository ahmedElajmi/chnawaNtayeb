import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { Notify } from '../useCatalogAdmin';

const NotifyContext = createContext<Notify | null>(null);

/**
 * Short messages of the backoffice ("Recette enregistrée", errors), shared by every page:
 * a page calls useNotify() instead of receiving a notify prop.
 */
export function NotifyProvider({ children }: { children: ReactNode }) {
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
          <span>{toast.message}</span>
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
