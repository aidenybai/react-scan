import type { FilterPattern } from "@rollup/pluginutils";

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
  enforce?: "pre" | "post" | undefined;
  flags?: {
    noTryCatchDisplayNames?: boolean;
    noStyledComponents?: boolean;
    noCreateContext?: boolean;
    ignoreComponentSubstrings?: Array<string>;
  };
}
