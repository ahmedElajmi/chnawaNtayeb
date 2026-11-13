import { describe, expect, it } from 'vitest';
import type { AccountCreationGateway } from '@/application';

/** Every AccountCreationGateway implementation must pass: same semantics as the server route. */
export function describeAccountCreation(name: string, create: (existing: string[]) => AccountCreationGateway): void {
  describe(`AccountCreationGateway (${name})`, () => {
    it('creates an employee account and returns its temporary password', async () => {
      const gateway = create([]);
      const result = await gateway.createEmployee({ email: 'new@b.co', displayName: 'Sami' });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.temporaryPassword.length).toBeGreaterThan(8);
    });

    it('refuses an e-mail that already has an account', async () => {
      const gateway = create(['taken@b.co']);
      const result = await gateway.createEmployee({ email: 'taken@b.co', displayName: 'Sami' });
      expect(result).toEqual({ ok: false, error: 'email-in-use' });
    });
  });
}
