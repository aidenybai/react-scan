import { defineConfig, UserConfig, loadEnv } from 'vite';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
import tsconfigPaths from 'vite-tsconfig-paths';

// Browser types
const BROWSER_TYPES = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  BRAVE: 'brave',
} as const;

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  const browser = env.BROWSER || BROWSER_TYPES.CHROME;

  const isBrave = browser === BROWSER_TYPES.BRAVE;

  // Validate Brave binary
  if (env.NODE_ENV === 'development' && isBrave && !env.BRAVE_BINARY) {
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
        return env.BRAVE_BINARY;
      case BROWSER_TYPES.CHROME:
        return env.CHROME_BINARY;
      default:
        return env.CHROME_BINARY;
    }
  };

  // Generate manifest with package info
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
      tsconfigPaths(),
      webExtension({
        manifest: generateManifest,
        // Use Chrome config for Brave
        browser: isBrave ? BROWSER_TYPES.CHROME : browser,
        webExtConfig: {
          browser: isBrave ? BROWSER_TYPES.CHROME : browser,
          target: isBrave ? BROWSER_TYPES.CHROME : browser,
          chromiumBinary: getBrowserBinary(),
          firefoxBinary: env.FIREFOX_BINARY,
          braveBinary: env.BRAVE_BINARY,
          startUrl: ['https://github.com/aidenybai/react-scan'],
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['react-scan'],
    },
  };
});
