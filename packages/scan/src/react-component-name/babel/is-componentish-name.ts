// This is just a Pascal heuristic
// we only assume a function is a component

import type { Options } from '../core/options';

// if the first character is in uppercase
export function isComponentishName(name: string, flags: Options['flags']) {
  return (
    name[0] >= 'A' &&
    name[0] <= 'Z' &&
    !flags?.ignoreComponentSubstrings?.some((substring) =>
      name.includes(substring),
    )
  );
}
