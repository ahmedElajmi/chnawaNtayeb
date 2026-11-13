import type { AccountCreationGateway } from '@/application';

/** In-memory account creation: same contract as the server (duplicate e-mail refused). */
export function createMemoryAccountCreation(
  existingEmails: string[] = []
): AccountCreationGateway & { created: { email: string; displayName: string; temporaryPassword: string }[] } {
  const created: { email: string; displayName: string; temporaryPassword: string }[] = [];
  const emails = new Set(existingEmails);
  let counter = 0;
  return {
    created,
    async createEmployee({ email, displayName }) {
      const clean = email.trim().toLowerCase();
      if (emails.has(clean)) return { ok: false, error: 'email-in-use' };
      counter += 1;
      const temporaryPassword = `temp-${counter}-${Math.random().toString(36).slice(2, 10)}`;
      emails.add(clean);
      created.push({ email: clean, displayName, temporaryPassword });
      return { ok: true, uid: `uid-${counter}`, temporaryPassword };
    },
  };
}
