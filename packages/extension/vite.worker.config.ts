import path from 'node:path';
import { type UserConfig, defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(
        __dirname,
        '../../packages/scan/src/new-outlines/offscreen-canvas.worker.ts',
      ),
      formats: ['es'] as const,
      fileName: (): string => 'offscreen-canvas.worker.js',
    },
    outDir: 'dist/workers',
    emptyOutDir: false,
    minify: 'esbuild' as const,
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'es',
      },
    },
  },
} satisfies UserConfig);
