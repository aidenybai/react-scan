import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';

function generateManifest() {
  const manifest = readJsonFile('src/manifest.json');
  const pkg = readJsonFile('package.json');
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      keep_fnames: true,
    },
  },
  plugins: [
    react(),
    webExtension({
      manifest: generateManifest,
      webExtConfig: {
        startUrl: 'https://github.com/aidenybai/react-scan',
        chromiumBinary: process.env.CHROMIUM_BINARY,
      },
    }),
  ],
  esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  },
});
