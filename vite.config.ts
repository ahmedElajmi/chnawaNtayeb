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
