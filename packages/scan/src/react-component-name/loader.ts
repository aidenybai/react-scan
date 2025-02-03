import { type FilterPattern, createFilter } from '@rollup/pluginutils';
import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE, transform } from '.';

interface LoaderContext {
  getOptions(): { include?: FilterPattern; exclude?: FilterPattern };
  resourcePath: string;
  async(): (
    error: Error | null,
    content?: string,
    sourceMap?: string | object,
  ) => void;
}

export default async function ReactComponentNameLoader(
  this: LoaderContext,
  code: string,
  sourceMap: string | object | undefined,
) {
  const parsedMap =
    typeof sourceMap === 'string' ? JSON.parse(sourceMap) : sourceMap;
  const callback = this.async();
  try {
    const options = this.getOptions();
    const id = this.resourcePath;
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
    if (!filter(id)) return callback(null, code, parsedMap);

    const result = await transform(code, id, filter);

    callback(
      null,
      result?.code || '',
      result?.map ? JSON.stringify(result.map) : undefined,
    );
  } catch (e) {
    callback(e as Error);
  }
}
