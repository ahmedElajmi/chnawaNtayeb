import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useContainer } from '@/app/ContainerContext';
import type { PasswordPolicy } from '@/core/accounts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';

const INPUT =
  'px-3 py-2 text-xs rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand';
const PRIMARY =
  'px-3 py-2 rounded-xl bg-brand text-on-brand font-bold text-xs hover:bg-brand-strong transition disabled:opacity-50';

/**
 * Password policy of the whole site (clients and employees alike): hashing algorithm,
 * strength criteria and account lockout — configured here, applied by the server.
 */
export function SecurityPage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { backofficePolicy } = useContainer();
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    backofficePolicy
      .read()
      .then(setPolicy)
      .catch(() => setPolicy(null));
  }, [backofficePolicy]);

  const patch = (partial: Partial<PasswordPolicy>) => setPolicy((p) => (p ? { ...p, ...partial } : p));

  const save = async () => {
    if (!policy) return;
    setBusy(true);
    try {
      await backofficePolicy.save(policy);
      notify(b.teamUpdated, false);
    } catch {
      notify(b.securitySaveFailed, true);
    } finally {
      setBusy(false);
    }
  };

  if (!policy) return <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card border border-line p-3 space-y-3">
        <label className="block text-[11px] font-semibold text-ink-muted">
          {b.secAlgorithm}
          <select
            value={policy.algorithm}
            onChange={(e) => patch({ algorithm: e.target.value })}
            className={`${INPUT} mt-1 w-full`}
          >
            <option value="argon2id">argon2id</option>
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-[11px] font-semibold text-ink-muted">
            {b.secMemory}
            <input
              type="number"
              min={2048}
              step={1024}
              dir="ltr"
              value={policy.params.memoryCost ?? 65536}
              onChange={(e) => patch({ params: { ...policy.params, memoryCost: parseInt(e.target.value, 10) || 0 } })}
              className={`${INPUT} mt-1 w-full`}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-muted">
            {b.secIterations}
            <input
              type="number"
              min={1}
              dir="ltr"
              value={policy.params.timeCost ?? 3}
              onChange={(e) => patch({ params: { ...policy.params, timeCost: parseInt(e.target.value, 10) || 1 } })}
              className={`${INPUT} mt-1 w-full`}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-muted">
            {b.secParallelism}
            <input
              type="number"
              min={1}
              dir="ltr"
              value={policy.params.parallelism ?? 4}
              onChange={(e) => patch({ params: { ...policy.params, parallelism: parseInt(e.target.value, 10) || 1 } })}
              className={`${INPUT} mt-1 w-full`}
            />
          </label>
        </div>
        <label className="block text-[11px] font-semibold text-ink-muted">
          {b.secMinLength}
          <input
            type="number"
            min={8}
            dir="ltr"
            value={policy.min_password_length}
            onChange={(e) => patch({ min_password_length: parseInt(e.target.value, 10) || 8 })}
            className={`${INPUT} mt-1 w-full`}
          />
        </label>
        <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-ink-muted">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={policy.require_digit}
              onChange={(e) => patch({ require_digit: e.target.checked })}
            />
            {b.secDigit}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={policy.require_uppercase}
              onChange={(e) => patch({ require_uppercase: e.target.checked })}
            />
            {b.secUpper}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={policy.require_special}
              onChange={(e) => patch({ require_special: e.target.checked })}
            />
            {b.secSpecial}
          </label>
        </div>
        <label className="block text-[11px] font-semibold text-ink-muted">
          {b.secMigration}
          <select
            value={policy.migration}
            onChange={(e) => patch({ migration: e.target.value as PasswordPolicy['migration'] })}
            className={`${INPUT} mt-1 w-full`}
          >
            <option value="auto">{b.secMigrationAuto}</option>
            <option value="force_change">{b.secMigrationForce}</option>
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-[11px] font-semibold text-ink-muted">
            {b.secLockAttempts}
            <input
              type="number"
              min={1}
              dir="ltr"
              value={policy.lockout.max_attempts}
              onChange={(e) =>
                patch({ lockout: { ...policy.lockout, max_attempts: parseInt(e.target.value, 10) || 5 } })
              }
              className={`${INPUT} mt-1 w-full`}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-muted">
            {b.secLockMinutes}
            <input
              type="number"
              min={1}
              dir="ltr"
              value={policy.lockout.lock_minutes}
              onChange={(e) =>
                patch({ lockout: { ...policy.lockout, lock_minutes: parseInt(e.target.value, 10) || 30 } })
              }
              className={`${INPUT} mt-1 w-full`}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-ink-muted pt-5">
            <input
              type="checkbox"
              checked={policy.lockout.auto_unlock}
              onChange={(e) => patch({ lockout: { ...policy.lockout, auto_unlock: e.target.checked } })}
            />
            {b.secLockAuto}
          </label>
        </div>
        <button type="button" onClick={save} disabled={busy} className={PRIMARY}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : <Save className="w-3.5 h-3.5 inline" />}{' '}
          {b.save}
        </button>
      </div>
    </div>
  );
}
