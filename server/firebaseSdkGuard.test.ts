import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guard of the storage independence (lot 1.3): no Firebase SDK access outside the two files
 * allowed to know it — server/firebaseAdmin.ts (the connection) and
 * server/storage/firestoreStore.ts (the Firestore adapter). The scan covers every form that
 * names the module: static imports, `import type`, dynamic `import()`, `require()` — all of
 * them carry the module specifier in the file text, so one check catches them all.
 *
 * Test files are exempt (arbitrage 4): the emulator suite legitimately bootstraps the SDK,
 * and the manual full-repository search stays part of every lot's review.
 */

const SERVER_DIR = fileURLToPath(new URL('.', import.meta.url));

const ALLOWED = new Set([join(SERVER_DIR, 'firebaseAdmin.ts'), join(SERVER_DIR, 'storage', 'firestoreStore.ts')]);

/** A quoted module specifier of any Firebase package (Admin SDK, client SDK, internals). */
const SDK_SPECIFIER = /['"](?:firebase-admin|@firebase|firebase)\/[^'"]*['"]/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });
}

describe('architecture: the Firebase SDK stays behind its two files', () => {
  it('no production file of server/ names the SDK outside the allowlist', () => {
    const offenders: string[] = [];
    for (const path of walk(SERVER_DIR)) {
      if (ALLOWED.has(path)) continue;
      const content = readFileSync(path, 'utf8');
      const match = content.match(SDK_SPECIFIER);
      if (match) offenders.push(`${path} → ${match[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('the allowlist is real: the two files do name the SDK (the guard cannot rot silently)', () => {
    for (const path of ALLOWED) {
      expect(readFileSync(path, 'utf8')).toMatch(SDK_SPECIFIER);
    }
  });
});
