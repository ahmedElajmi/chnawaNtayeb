/**
 * Diagnostic (lot 1.4): G-DIR pagination over the memory store — why does a continued
 * pagination stop at u9 while u10..u13 exist? Prints every page's items, total and cursor.
 */
import { createMemoryDataStore } from '../../server/storage/memoryDataStore';

const store = createMemoryDataStore();
for (let i = 0; i < 10; i++) await store.put('users', `u${i}`, { email: `u${i}@x.co`, type: 'client' });
const first = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 5 });
console.log(
  'first:',
  first.items.map((d) => d.id),
  'total',
  first.total,
  'cursor',
  first.nextCursor
);
await store.put('users', 'u10', { email: 'u10@x.co', type: 'client' });
await store.put('users', 'u11', { email: 'u11@x.co', type: 'client' });
await store.remove('users', 'u2');
await store.put('users', 'u12', { email: 'u12@x.co', type: 'client' });
await store.put('users', 'u13', { email: 'u13@x.co', type: 'client' });
let after: string | null = first.nextCursor;
// Probe: what does the store answer for each cursor?
for (const probe of ['u4', 'u9']) {
  const p = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 5, after: probe });
  console.log(
    'probe after',
    probe,
    '-> items',
    p.items.map((d) => d.id),
    'next',
    p.nextCursor,
    'total',
    p.total
  );
}
for (;;) {
  const page = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 5, after });
  console.log(
    'page after',
    after,
    '->',
    page.items.map((d) => d.id),
    'total',
    page.total,
    'next',
    page.nextCursor
  );
  after = page.nextCursor;
  if (!after) break;
}
