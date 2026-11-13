import type { AccountCreationGateway } from '@/application';
import { getPatronToken } from '@/infrastructure/http/patronAuth';

/**
 * Employee account creation, done by our server (Admin SDK) behind the patron session:
 * the browser never creates a right, it only asks the server to.
 */
export const accountHttpGateway: AccountCreationGateway = {
  async createEmployee({ email, displayName }) {
    try {
      const response = await fetch('/admin/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getPatronToken() ? { Authorization: `Bearer ${getPatronToken()}` } : {}),
        },
        body: JSON.stringify({ email, displayName }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        uid?: string;
        temporaryPassword?: string;
        error?: string;
      };
      if (!response.ok) {
        const error =
          body.error === 'email-in-use' ? 'email-in-use' : body.error === 'invalid-email' ? 'invalid-email' : 'server';
        return { ok: false, error };
      }
      if (!body.ok || !body.uid || !body.temporaryPassword) return { ok: false, error: 'server' };
      return { ok: true, uid: body.uid, temporaryPassword: body.temporaryPassword };
    } catch {
      return { ok: false, error: 'server' };
    }
  },
};
