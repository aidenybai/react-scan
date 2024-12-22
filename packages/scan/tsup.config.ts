import fsPromise from 'node:fs/promises';
import * as fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';
import { init, parse } from 'es-module-lexer';

const DIST_PATH = './dist';

if (!fs.existsSync(DIST_PATH)) {
  fs.mkdirSync(DIST_PATH, { recursive: true });
}

const addDirectivesToChunkFiles = async (readPath: string): Promise<void> => {
  try {
    const files = await fsPromise.readdir(readPath);
    for (const file of files) {
      if (file.endsWith('.mjs') || file.endsWith('.js')) {
        const filePath = path.join(readPath, file);

        const data = await fsPromise.readFile(filePath, 'utf8');

        const updatedContent = `'use client';\n${data}`;

        await fsPromise.writeFile(filePath, updatedContent, 'utf8');
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console -- We need to log the error
    console.error('Error:', err);
  }
};

const banner = `/**
 * Copyright 2024 Aiden Bai, Million Software, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */`;

void (async () => {
  await init;

  const code = fs.readFileSync('./src/core/index.ts', 'utf8');
  const [_, allExports] = parse(code);
  const names: Array<string> = [];
  for (const exportItem of allExports) {
    names.push(exportItem.n);
  }

  const createFn = (name: string) =>
    `let ${name}=()=>{console.error('Do not use ${name} directly in a Server Component module. It should only be used in a Client Component.');return undefined}`;
  const createVar = (name: string) => `let ${name}=undefined`;

  let script = '';
  for (const name of names) {
    if (name[0].toLowerCase() === name[0]) {
      script += `${createFn(name)}\n`;
      continue;
    }
    script += `${createVar(name)}\n`;
  }

  setTimeout(() => {
    for (const ext of ['js', 'mjs', 'global.js']) {
      fs.writeFileSync(`./dist/rsc-shim.${ext}`, script);
    }
    for (const ext of ['d.mts', 'd.ts']) {
      fs.writeFileSync(`./dist/rsc-shim.${ext}`, `export {}`);
    }
  }, 500); // for some reason it clears the file if we don't wait
})();

export default defineConfig([
  {
    entry: ['./src/auto.ts', './src/install-hook.ts'],
    outDir: DIST_PATH,
    banner: {
      js: banner,
    },
    splitting: false,
    clean: false,
    sourcemap: false,
    format: ['iife'],
    target: 'esnext',
    platform: 'browser',
    treeshake: true,
    dts: true,
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,

    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
    external: [
      'react',
      'react-dom',
      'react-reconciler',
      'next',
      'next/navigation',
      'react-router',
      'react-router-dom',
      '@remix-run/react',
    ],
    loader: {
      '.css': 'text',
    },
  },
  {
    entry: [
      './src/index.ts',
      './src/install-hook.ts',
      './src/core/monitor/index.ts',
      './src/core/monitor/params/next.ts',
      './src/core/monitor/params/react-router-v5.ts',
      './src/core/monitor/params/react-router-v6.ts',
      './src/core/monitor/params/remix.ts',
      './src/core/monitor/params/astro/component.ts',
    ],
    banner: {
      js: banner,
    },
    outDir: DIST_PATH,
    splitting: false,
    clean: true,
    sourcemap: false,
    format: ['cjs', 'esm'],
    target: 'esnext',
    platform: 'browser',
    // FIXME: tree shaking removes use client directive
    // Info: vercel analytics does the same thing- https://github.com/vercel/analytics/blob/main/packages/web/tsup.config.js
    treeshake: false,
    dts: true,
    watch: process.env.NODE_ENV === 'development',
    async onSuccess() {
      await Promise.all([
        addDirectivesToChunkFiles(DIST_PATH),
        addDirectivesToChunkFiles(`${DIST_PATH}/core/monitor/params`),
        addDirectivesToChunkFiles(`${DIST_PATH}/core/monitor`),
      ]);
    },
    minify: false,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
      NPM_PACKAGE_VERSION: JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../scan', 'package.json'),
          'utf8',
        ),
      ).version,
    },
    external: [
      'react',
      'react-dom',
      'react-reconciler',
      'next',
      'next/navigation',
      'react-router',
      'react-router-dom',
      '@remix-run/react',
      'preact',
      '@preact/signals',
    ],
    loader: {
      '.css': 'text',
    },
    esbuildPlugins: [
      TsconfigPathsPlugin({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
      }),
    ],
  },
  {
    entry: ['./src/cli.mts'],
    outDir: DIST_PATH,
    banner: {
      js: banner,
    },
    splitting: false,
    clean: true,
    sourcemap: false,
    format: ['cjs'],
    target: 'esnext',
    platform: 'node',
    minify: false,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
    watch: process.env.NODE_ENV === 'development',
  },
  {
    entry: [
      './src/react-component-name/index.ts',
      './src/react-component-name/vite.ts',
      './src/react-component-name/webpack.ts',
      './src/react-component-name/esbuild.ts',
      './src/react-component-name/rspack.ts',
      './src/react-component-name/rolldown.ts',
      './src/react-component-name/rollup.ts',
      './src/react-component-name/astro.ts',
    ],
    outDir: `${DIST_PATH}/react-component-name`,
    splitting: false,
    sourcemap: false,
    clean: true,
    format: ['cjs', 'esm'],
    target: 'esnext',
    external: [
      'unplugin',
      'estree-walker',
      '@rollup/pluginutils',
      '@babel/types',
      '@babel/parser',
      '@babel/traverse',
      '@babel/generator',
      '@babel/core',
      'rollup',
      'webpack',
      'esbuild',
      'rspack',
      'vite',
    ],
    dts: true,
    minify: false,
    treeshake: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.js',
    }),
    esbuildOptions: (options, context) => {
      options.mainFields = ['module', 'main'];
      options.conditions = ['import', 'require', 'node', 'default'];
      options.format = context.format === 'esm' ? 'esm' : 'cjs';
      options.preserveSymlinks = true;
    },
  },
]);
