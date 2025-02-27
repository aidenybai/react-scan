import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import preserveDirectives from 'rollup-preserve-directives';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ReactScan',
      // the proper extensions will be added
      fileName: 'react-scan-component',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-scan', 'react/jsx-runtime'],
    },
  },
  plugins: [
    preserveDirectives(),
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
});
