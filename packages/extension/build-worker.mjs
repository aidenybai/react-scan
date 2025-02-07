import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWorker() {
  try {
    const entryPath = path.resolve(
      __dirname,
      '../../packages/scan/src/new-outlines/offscreen-canvas.worker.ts',
    );
    const outputPath = path.resolve(__dirname, 'dist/assets');

    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.log('Building worker with entry:', entryPath);
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.log('Output directory:', outputPath);

    await build({
      build: {
        lib: {
          entry: entryPath,
          formats: ['iife'],
          fileName: () => 'offscreen-canvas.worker.js',
          name: 'OffscreenCanvasWorker',
        },
        outDir: outputPath,
        emptyOutDir: false,
        copyPublicDir: false,
        assetsDir: 'assets',
      },
    });

    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.log('Worker build completed successfully!');
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.error('Worker build failed:', error);
    process.exit(1);
  }
}

buildWorker();
