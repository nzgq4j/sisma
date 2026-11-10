// Test runner settings: the same "@/…" import path as the app (tsconfig paths) and React's automatic JSX for .tsx tests.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  esbuild: { jsx: 'automatic' },
});
