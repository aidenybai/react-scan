import { ReactScanInternals } from '~core/index';
import { SAFE_AREA } from '~web/constants';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const isFinitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const getSafeArea = (): SafeAreaInsets => {
  const value = ReactScanInternals.options.value.safeArea;

  if (isFinitePositive(value)) {
    return { top: value, right: value, bottom: value, left: value };
  }

  if (isPlainObject(value)) {
    const top = value.top;
    const right = value.right;
    const bottom = value.bottom;
    const left = value.left;
    return {
      top: isFinitePositive(top) ? top : SAFE_AREA,
      right: isFinitePositive(right) ? right : SAFE_AREA,
      bottom: isFinitePositive(bottom) ? bottom : SAFE_AREA,
      left: isFinitePositive(left) ? left : SAFE_AREA,
    };
  }

  return {
    top: SAFE_AREA,
    right: SAFE_AREA,
    bottom: SAFE_AREA,
    left: SAFE_AREA,
  };
};
