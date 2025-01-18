import * as esbuild from 'esbuild';

/**
 * A hacky plugin to build the worker file (resolving all imports), and inline
 * the javascript into a variable by replacing __WORKER_CODE__ string in bundle with the worker
 * build output
 */
export const workerPlugin = {
  name: 'worker-plugin',
  setup(build) {
    const workerResult = esbuild.buildSync({
      entryPoints: ['src/new-outlines/offscreen-canvas.worker.ts'],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      minify: true,
    });
    const workerCode = workerResult.outputFiles[0].text;

    build.onEnd((result) => {
      if (!result.outputFiles) return;

      for (const file of result.outputFiles) {
        const newText = file.text.replace(
          'var workerCode = "__WORKER_CODE__"',
          `var workerCode = ${JSON.stringify(workerCode)}`,
        );
        file.contents = Buffer.from(newText);
      }
    });
  },
};
