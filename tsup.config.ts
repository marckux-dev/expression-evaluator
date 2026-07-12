import { defineConfig } from 'tsup';

// Dual build: dist/index.js (+ .d.ts) for require(), dist/index.mjs
// (+ .d.mts) for import — wired to consumers via "exports" in package.json.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
