import { transformAsync } from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import { createUnplugin } from 'unplugin';
import { reactScanComponentNamePlugin } from './babel';
import type { Options } from './core/options';

export const transform = async (
  code: string,
  id: string,
  filter: (id: string) => boolean,
  options?: Options,
) => {
  if (!filter(id)) return null;

  try {
    const result = await transformAsync(code, {
      plugins: [reactScanComponentNamePlugin(options)],
      ignore: [/\/(?<c>build|node_modules)\//],
      parserOpts: {
        plugins: ['jsx', 'typescript', 'decorators'],
      },
      cloneInputAst: false,
      filename: id,
      ast: false,
      highlightCode: false,
      sourceMaps: true,
      configFile: false,
      babelrc: false,
      generatorOpts: {
        jsescOption: {
          quotes: 'single',
          minimal: true,
        },
      },
    });

    if (result?.code) {
      return { code: result.code ?? '', map: result.map };
    }

    return null;
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error('Error processing file:', id, error);
    return null;
  }
};

export const DEFAULT_INCLUDE = '**/*.{mtsx,mjsx,tsx,jsx}';
export const DEFAULT_EXCLUDE = '**/node_modules/**';
export const reactComponentNamePlugin = createUnplugin<Options>(
  (options?: Options) => {
    // mirror to loader.ts when changing this
    const filter = createFilter(
      options?.include || DEFAULT_INCLUDE,
      options?.exclude || [
        DEFAULT_EXCLUDE,
        // Next.js pages dir specific
        '**/_app.{jsx,tsx,js,ts}',
        '**/_document.{jsx,tsx,js,ts}',
        '**/api/**/*',
        // Million.js specific
        '**/.million/**/*',
      ],
    );

    return {
      name: 'react-component-name',
      enforce: 'post',
      async transform(code, id) {
        return transform(code, id, filter, options);
      },
    };
  },
);

export default reactComponentNamePlugin;
export type { Options };
