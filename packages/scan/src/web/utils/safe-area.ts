import { getOptionsState } from "../../core/native-state";
import { isFiniteNonNegative } from "../../utils/is-finite-non-negative";
import { isPlainObject } from "../../utils/is-plain-object";
import { SAFE_AREA } from "../constants";

export interface ResolvedSafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const getSafeArea = (): ResolvedSafeAreaInsets => {
  const value = getOptionsState().safeArea;

  if (isFiniteNonNegative(value)) {
    return { top: value, right: value, bottom: value, left: value };
  }

  if (isPlainObject(value)) {
    const top = value.top;
    const right = value.right;
    const bottom = value.bottom;
    const left = value.left;
    return {
      top: isFiniteNonNegative(top) ? top : SAFE_AREA,
      right: isFiniteNonNegative(right) ? right : SAFE_AREA,
      bottom: isFiniteNonNegative(bottom) ? bottom : SAFE_AREA,
      left: isFiniteNonNegative(left) ? left : SAFE_AREA,
    };
  }

  return {
    top: SAFE_AREA,
    right: SAFE_AREA,
    bottom: SAFE_AREA,
    left: SAFE_AREA,
  };
};
