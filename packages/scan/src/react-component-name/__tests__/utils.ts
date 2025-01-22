import { Options, reactComponentNamePlugin } from '..';

type TransformFn = (
  code: string,
  id: string,
) => Promise<{ code: string } | string | null>;

export const transform = async (code: string, options?: Options) => {
  const plugin = reactComponentNamePlugin.vite(options || {}) as {
    transform: TransformFn;
  };
  const transformFn = plugin.transform;
  if (!transformFn) return code;

  const result = await transformFn.call(
    {
      getCombinedSourcemap: () => null,
      error: console.error,
    },
    code,
    'test.tsx',
  );

  if (!result) return code;
  if (typeof result === 'string') return result;
  return result.code;
};
