import React, { useState } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

/**
 * Invitation to create an account when the device already holds kitchen data (favorites,
 * fridge, pantry, shopping list) without any account: the sync is the real value of an
 * account, so it is offered once the data exists — never pushed earlier. The eligibility
 * comes from the container (`kitchenSync.hasLocalData()`); dismissal is remembered on the
 * device through plain localStorage (no data, only the user's choice).
 */

const DISMISS_KEY = 'chnowa_sync_invite_dismissed';

interface Props {
  /** True when a client or employee session exists (guests and signed-out visitors are eligible) */
  signedIn: boolean;
  /** True when this device holds kitchen data that a sync would carry up */
  hasLocalData: boolean;
  /** Opens the account dialog (the CTA leads to the registration form) */
  onOpenAccount: () => void;
}

export const SyncInviteBanner: React.FC<Props> = ({ signedIn, hasLocalData, onOpenAccount }) => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (signedIn || dismissed || !hasLocalData) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode: this visit only */
    }
  };

  return (
    <div role="region" aria-label={t.syncInviteTitle} className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
      <div className="flex items-start gap-3 p-3 rounded-2xl bg-accent/10 border border-accent/25 animate-fade-in">
        <span className="w-8 h-8 rounded-xl bg-accent text-on-accent flex items-center justify-center shrink-0">
          <CloudUpload className="w-4 h-4 stroke-[2.5]" />
        </span>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-ink">{t.syncInviteTitle}</p>
            <p className="text-xs text-ink-muted">{t.syncInviteText}</p>
          </div>
          <button
            onClick={onOpenAccount}
            className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-accent text-on-accent text-xs font-bold hover:bg-accent-strong active:scale-95 transition"
          >
            {t.syncInviteAction}
          </button>
        </div>
        <button
          onClick={dismiss}
          aria-label={t.syncInviteDismiss}
          title={t.syncInviteDismiss}
          className="p-1 -m-1 rounded-lg text-ink-muted hover:text-ink hover:bg-accent/10 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
