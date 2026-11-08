import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards the architecture rules of docs/encyclopedie/02-architecture.md:
 * the domain (src/core) is plain TypeScript, with no UI framework, backend SDK or browser API,
 * so that the backend and the UI framework can be replaced without touching business rules.
 */

const CORE_DIR = path.resolve(import.meta.dirname);
const SRC_DIR = path.resolve(CORE_DIR, '..');

const FORBIDDEN_PACKAGES = [
  /^react(-dom)?(\/|$)/,
  /^firebase(\/|$)/,
  /^firebase-admin/,
  /^@google\//,
  /^motion/,
  /^lucide-react/,
];
const FORBIDDEN_GLOBALS = /\b(window|document|localStorage|sessionStorage|navigator|fetch)\s*[.(]/;

function listFiles(dir: string, filter: (file: string) => boolean): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, filter);
    return filter(full) ? [full] : [];
  });
}

function importsOf(file: string): string[] {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

const isSource = (f: string) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts');
const coreFiles = listFiles(CORE_DIR, isSource);
const rel = (f: string) => path.relative(SRC_DIR, f).replace(/\\/g, '/');

describe('architecture: src/core is the pure domain', () => {
  it('has source files', () => {
    expect(coreFiles.length).toBeGreaterThan(10);
  });

  it('never imports a UI framework or a backend SDK', () => {
    const offenders = coreFiles.flatMap((file) =>
      importsOf(file)
        .filter((spec) => FORBIDDEN_PACKAGES.some((re) => re.test(spec)))
        .map((spec) => `${rel(file)} -> ${spec}`)
    );
    expect(offenders).toEqual([]);
  });

  it('only imports other core files (no app, UI or infrastructure code)', () => {
    const offenders = coreFiles.flatMap((file) =>
      importsOf(file)
        .filter((spec) => {
          if (spec.startsWith('@/')) return !spec.startsWith('@/core/');
          if (!spec.startsWith('.')) return false; // packages are checked above
          return !path.resolve(path.dirname(file), spec).startsWith(CORE_DIR);
        })
        .map((spec) => `${rel(file)} -> ${spec}`)
    );
    expect(offenders).toEqual([]);
  });

  it('does not use browser APIs (storage, DOM, network)', () => {
    const offenders = coreFiles.filter((file) => FORBIDDEN_GLOBALS.test(fs.readFileSync(file, 'utf8'))).map(rel);
    expect(offenders).toEqual([]);
  });
});

describe('architecture: src/application has no UI framework and no backend SDK', () => {
  const APP_DIR = path.join(SRC_DIR, 'application');
  const files = listFiles(APP_DIR, isSource);

  it('only depends on the domain (src/core) and on itself', () => {
    const offenders = files.flatMap((file) =>
      importsOf(file)
        .filter((spec) => {
          if (FORBIDDEN_PACKAGES.some((re) => re.test(spec))) return true;
          if (spec.startsWith('@/')) return !spec.startsWith('@/core/') && !spec.startsWith('@/application');
          if (spec.startsWith('.')) return !path.resolve(path.dirname(file), spec).startsWith(APP_DIR);
          return false;
        })
        .map((spec) => `${rel(file)} -> ${spec}`)
    );
    expect(files.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});

describe('architecture: src/infrastructure never depends on the UI', () => {
  it('does not import React or UI code', () => {
    const files = listFiles(path.join(SRC_DIR, 'infrastructure'), isSource);
    const offenders = files.flatMap((file) =>
      importsOf(file)
        .filter((spec) => spec.startsWith('react') || /^@\/(features|components|app|context)\//.test(spec))
        .map((spec) => `${rel(file)} -> ${spec}`)
    );
    expect(offenders).toEqual([]);
  });
});

describe('architecture: the UI only talks to ports', () => {
  it('features, shared and app code never import infrastructure or a backend SDK (only src/app/container.ts wires adapters)', () => {
    const uiFiles = ['features', 'shared', 'app'].flatMap((dir) => listFiles(path.join(SRC_DIR, dir), isSource));
    const offenders = uiFiles
      .filter((file) => rel(file) !== 'app/container.ts')
      .flatMap((file) =>
        importsOf(file)
          .filter(
            (spec) => spec.startsWith('@/infrastructure') || /^firebase(\/|$)/.test(spec) || spec.startsWith('@google/')
          )
          .map((spec) => `${rel(file)} -> ${spec}`)
      );
    expect(uiFiles.length).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });
});

describe('architecture: the database can be replaced at any time', () => {
  it('no database vendor is named outside src/infrastructure and src/app/container.ts (code, comments or texts)', () => {
    const VENDOR = /firebase|firestore/i;
    const files = ['core', 'application', 'features', 'shared', 'app'].flatMap((dir) =>
      listFiles(path.join(SRC_DIR, dir), isSource)
    );
    const offenders = files
      .filter((file) => rel(file) !== 'app/container.ts' && !file.endsWith('.test.tsx'))
      .filter((file) => VENDOR.test(fs.readFileSync(file, 'utf8')))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});

describe('architecture: modules are used through their public API', () => {
  it('code outside src/core imports core modules only via their index (e.g. @/core/catalog)', () => {
    const outside = listFiles(SRC_DIR, (f) => /\.tsx?$/.test(f) && !f.startsWith(CORE_DIR));
    const offenders = outside.flatMap((file) =>
      importsOf(file)
        .filter((spec) => {
          const target = spec.startsWith('@/')
            ? path.join(SRC_DIR, spec.slice(2))
            : spec.startsWith('.')
              ? path.resolve(path.dirname(file), spec)
              : null;
          if (!target || !target.startsWith(CORE_DIR)) return false;
          return path.relative(CORE_DIR, target).split(path.sep).length !== 1; // core/<module> only
        })
        .map((spec) => `${rel(file)} -> ${spec}`)
    );
    expect(offenders).toEqual([]);
  });
});
