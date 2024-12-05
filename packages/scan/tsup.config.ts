import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/index.ts', './src/auto.ts', './src/rsc-shim.ts'],
    outDir: './dist',
    splitting: false,
    sourcemap: false,
    format: ['cjs', 'esm', 'iife'],
    target: 'es2018',
    platform: 'browser',
    treeshake: true,
    dts: true,
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
    external: ['react', 'react-dom', 'react-reconciler'],
  },
  {
    entry: ['./src/cli.mts'],
    outDir: './dist',
    splitting: false,
    sourcemap: false,
    format: ['cjs'],
    target: 'esnext',
    platform: 'node',
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
  },
]);
