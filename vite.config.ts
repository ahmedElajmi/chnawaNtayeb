import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Versions the service worker cache: each build gets a new cache and an update prompt
      __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    test: {
      // Agent sessions create git worktrees under .claude/worktrees; their stale
      // test files must never run alongside the real suite.
      exclude: [...configDefaults.exclude, '**/.claude/**'],
      // Reuse workers across files: the suite is pure logic, isolation buys nothing.
      isolate: false,
      // Two lanes: the Firestore emulator suites share one emulator base and wipe
      // collections between their tests, so they must never overlap (see lot T1 and
      // docs/solution/qualite-tests.md). Everything else keeps full parallelism.
      // Convention: any new test file that touches FIRESTORE_EMULATOR_HOST must be added
      // to the `emulator` project's include AND the `unit` project's exclude — both at once.
      projects: [
        {
          test: {
            name: 'emulator',
            include: [
              'server/storage/firestoreStore.test.ts',
              'server/storage/firestoreStore.attempt.test.ts',
              'server/storage/firestoreStore.order.test.ts',
              'server/routes/kitchenStockConvergence.test.ts',
            ],
            // One emulator suite at a time: they share the same base.
            fileParallelism: false,
            // Different maxWorkers than `unit` requires a distinct groupOrder (Vitest 5).
            sequence: { groupOrder: 1 },
          },
        },
        {
          test: {
            name: 'unit',
            include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
            exclude: [
              ...configDefaults.exclude,
              '**/.claude/**',
              'server/storage/firestoreStore.test.ts',
              'server/storage/firestoreStore.attempt.test.ts',
              'server/storage/firestoreStore.order.test.ts',
              'server/routes/kitchenStockConvergence.test.ts',
            ],
          },
        },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
