import { defineConfig } from 'tsup';

const commonConfig = {
  outDir: './dist',
  splitting: false,
  sourcemap: false,
  target: 'esnext' as const,
  treeshake: true,
  dts: true,
  minify: false,

  esbuildOptions: (options) => {
    options.external = [
      'react-native',
      '@shopify/react-native-skia',
      'react-native-reanimated',
      '@react-native/metro-config',
    ];
  },
};

export default defineConfig([
  // Web build
  {
    entry: ['./src/index.ts', './src/auto.ts', './src/rsc-shim.ts'],
    outDir: './dist',
    splitting: false,
    sourcemap: false,
    format: ['cjs', 'esm', 'iife'],
    target: 'esnext',
    platform: 'browser',
    treeshake: true,
    dts: true,
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
    external: ['react', 'react-dom', 'react-reconciler'],
  },
  // CLI build
  {
    ...commonConfig,
    entry: ['./src/cli.mts'],
    format: ['cjs'],
    platform: 'node',
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
  },

  // Native build
  {
    ...commonConfig,
    entry: ['./src/native.ts', './src/core/native/index.ts'],
    format: ['cjs'],
    platform: 'node',
    external: [
      'react',
      'react-native',
      '@shopify/react-native-skia',
      'react-native-reanimated',
    ],
    target: 'esnext',
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
  // Plugins
  {
    entry: [
      './src/core/native/plugins/babel.ts',
      './src/core/native/plugins/transformer.ts',
    ],
    format: ['cjs'],
    platform: 'node',
  },
]);
