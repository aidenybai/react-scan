import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  plugins: [
    react({}),
    Inspect(),
  ],
  resolve:
    process.env.NODE_ENV === 'production' && !process.env.TEST
      ? {}
      : {
          alias: {
            'react-scan/auto': path.resolve(__dirname, '../scan/dist/auto.mjs'),
            'react-scan/packages/dist/index.mjs': path.resolve(
              __dirname,
              '../scan/dist/index.mjs',
            ),
            'react-scan': path.resolve(__dirname, '../scan'),
          },
        },
});
