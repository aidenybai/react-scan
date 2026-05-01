import type { Options } from '~core/index';
import { isFiniteNonNegative } from '~web/utils/is-finite-non-negative';
import { isPlainObject } from '~web/utils/is-plain-object';

type SafeAreaOption = NonNullable<Options['safeArea']>;

export type ParsedSafeAreaOption =
  | { ok: true; value: SafeAreaOption }
  | { ok: false; error: string };

const SAFE_AREA_EDGES = ['top', 'right', 'bottom', 'left'] as const;

export const parseSafeAreaOption = (value: unknown): ParsedSafeAreaOption => {
  if (isFiniteNonNegative(value)) {
    return { ok: true, value };
  }

  if (!isPlainObject(value)) {
    return {
      ok: false,
      error: `- safeArea must be a non-negative number or { top?, right?, bottom?, left? }. Got "${JSON.stringify(value)}"`,
    };
  }

  const inset: Partial<Record<(typeof SAFE_AREA_EDGES)[number], number>> = {};
  for (const edge of SAFE_AREA_EDGES) {
    const edgeValue = value[edge];
    if (edgeValue === undefined) continue;
    if (!isFiniteNonNegative(edgeValue)) {
      return {
        ok: false,
        error: `- safeArea.${edge} must be a non-negative number. Got "${JSON.stringify(edgeValue)}"`,
      };
    }
    inset[edge] = edgeValue;
  }
  return { ok: true, value: inset };
};
