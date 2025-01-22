import type { FilterPattern } from '@rollup/pluginutils';

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  enforce?: 'pre' | 'post' | undefined;
  flags?: {
    noTryCatchDisplayNames?: boolean;
    noStyledComponents?: boolean;
    ignoreComponentSubstrings?: Array<string>;
  };
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type OptionsResolved = Overwrite<
  Required<Options>,
  Pick<Options, 'enforce'>
>;

export function resolveOptions(options: Options): OptionsResolved {
  return {
    include: options.include ?? [/\.[cm]?[jt]sx?$/],
    exclude: options.exclude ?? [/node_modules/],
    enforce: 'enforce' in options ? options.enforce : 'pre',
    flags: options.flags ?? {},
  };
}
