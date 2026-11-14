import type { PasswordPolicy, PasswordPolicyGateway } from '@/application';
import { getBackofficeToken } from './backofficeAuth';

/** Password policy read/saved on the server, super-admin session required. */
export const passwordPolicyGateway: PasswordPolicyGateway = {
  async read() {
    const token = getBackofficeToken();
    const res = await fetch('/admin/api/password-policy', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = (await res.json().catch(() => ({}))) as { policy?: PasswordPolicy };
    if (!res.ok || !body.policy) throw new Error('policy_unavailable');
    return body.policy;
  },

  async save(policy) {
    const token = getBackofficeToken();
    const res = await fetch('/admin/api/password-policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ policy }),
    });
    if (!res.ok) throw new Error('policy_save_failed');
  },
};
