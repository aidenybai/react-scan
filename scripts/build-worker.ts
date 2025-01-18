import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/new-outlines/offscreen-canvas.worker.ts'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/offscreen-canvas.worker.js',
  minify: true,
}); 