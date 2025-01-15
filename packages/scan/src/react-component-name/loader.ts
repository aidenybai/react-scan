import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE, transform } from '.';
import { createFilter } from '@rollup/pluginutils';

export default async function ReactComponentNameLoader(
  this: any,
  code: string,
  map: any,
) {
  if (typeof map === 'string') {
    map = JSON.parse(map);
  }
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
    if (!filter(id)) return callback(null, code);

    const result = await transform(code, id, filter);

    callback(
      null,
      result?.code || '',
      JSON.stringify(result?.map) || undefined,
    );
  } catch (e) {
    callback(e as Error);
  }
}
