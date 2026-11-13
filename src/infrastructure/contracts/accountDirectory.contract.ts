import { describe, expect, it } from 'vitest';
import type { AccountDirectoryRepository } from '@/application';

/** Every AccountDirectoryRepository implementation must pass: same semantics as the Firebase adapter. */
export function describeAccountDirectory(name: string, create: () => AccountDirectoryRepository): void {
  describe(`AccountDirectoryRepository (${name})`, () => {
    it('lists every account paged by uid with an exact total', async () => {
      const repo = create();
      const page1 = await repo.list({ type: 'all', limit: 2 });
      expect(page1.items.map((u) => u.uid)).toEqual(['u1', 'u2']);
      expect(page1.total).toBe(5);
      expect(page1.nextCursor).toBe('u2');
      const page2 = await repo.list({ type: 'all', limit: 2, cursor: 'u2' });
      expect(page2.items.map((u) => u.uid)).toEqual(['u3', 'u4']);
      expect(page2.total).toBe(5);
    });

    it('filters by the stored type; a legacy document shows only under all (typed at next login)', async () => {
      const repo = create();
      const clients = await repo.list({ type: 'client', limit: 10 });
      expect(clients.items.map((u) => u.uid)).toEqual(['u1', 'u2']);
      const employees = await repo.list({ type: 'employee', limit: 10 });
      expect(employees.items.map((u) => u.uid)).toEqual(['u3']);
      const all = await repo.list({ type: 'all', limit: 10 });
      expect(all.items.find((u) => u.uid === 'u4')?.type).toBe('client');
    });

    it('searches by e-mail prefix and never paginates a search', async () => {
      const repo = create();
      const found = await repo.list({ type: 'all', search: 'sam', limit: 10 });
      expect(found.items.map((u) => u.email)).toEqual(['sami@b.co']);
      expect(found.nextCursor).toBeNull();
      const none = await repo.list({ type: 'all', search: 'zzz', limit: 10 });
      expect(none.items).toEqual([]);
    });

    it('keeps guests in the list, without leaking favorites or the fridge', async () => {
      const repo = create();
      const page = await repo.list({ type: 'all', limit: 10 });
      const guest = page.items.find((u) => u.uid === 'u5');
      expect(guest?.isAnonymous).toBe(true);
      for (const user of page.items) expect(user).not.toHaveProperty('favorites');
    });
  });
}
