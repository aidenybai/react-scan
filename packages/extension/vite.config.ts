import react from '@vitejs/plugin-react';
import { type UserConfig, defineConfig, loadEnv } from 'vite';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
import tsconfigPaths from 'vite-tsconfig-paths';

// Browser types
const BROWSER_TYPES = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  BRAVE: 'brave',
} as const;

type BrowserType = (typeof BROWSER_TYPES)[keyof typeof BROWSER_TYPES];

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  const browser = (env.BROWSER || BROWSER_TYPES.CHROME) as BrowserType;

  const isBrave = browser === BROWSER_TYPES.BRAVE;

  // Validate Brave binary
  if (env.NODE_ENV === 'development' && isBrave && !env.BRAVE_BINARY) {
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.error(`
    ⚛️  React Scan
    ==============
    🚫 Error: BRAVE_BINARY environment variable is missing

    This is required for Brave browser development.
    Please check .env.example and set up your .env file with the correct path:

    📍 For macOS:
       BRAVE_BINARY="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

    📍 For Windows:
       BRAVE_BINARY="C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"

    📍 For Linux:
       BRAVE_BINARY="/usr/bin/brave"
    ===============
    `);
    process.exit(0);
  }

  // Get browser binary based on type
  const getBrowserBinary = () => {
    switch (browser) {
      case BROWSER_TYPES.FIREFOX:
        return env.FIREFOX_BINARY;
      case BROWSER_TYPES.BRAVE:
        return env.BRAVE_BINARY || env.CHROME_BINARY;
      case BROWSER_TYPES.CHROME:
        return env.CHROME_BINARY;
      default:
        return env.CHROME_BINARY;
    }
  };

  // Generate manifest with package info
  const generateManifest = () => {
    const manifestPath =
      browser === BROWSER_TYPES.FIREFOX
        ? 'src/manifest.firefox.json'
        : 'src/manifest.chrome.json';

    const manifest = readJsonFile(manifestPath);
    const pkg = readJsonFile('package.json');

    return {
      ...manifest,
      name: pkg.name,
      description: pkg.description,
      version: pkg.version,
    };
  };

  // Vite configuration
  return {
    build: {
      minify: 'esbuild' as const,
    },
    esbuild: {
      keepNames: true,
      minifyIdentifiers: false,
    },
    plugins: [
      react(),
      tsconfigPaths(),
      webExtension({
        manifest: generateManifest,
        // Use Chrome config for Brave
        webExtConfig: {
          target: isBrave
            ? 'chromium'
            : browser === 'firefox'
              ? 'firefox-desktop'
              : 'chromium',
          chromiumBinary: getBrowserBinary(),
          firefoxBinary: env.FIREFOX_BINARY,
          startUrl: ['https://github.com/aidenybai/react-scan'],
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['react-scan'],
    },
  };
});
