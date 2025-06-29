import { ReactScanInternals, scan as innerScan } from '.';

export const scan = /*#__PURE__*/ (...params: Parameters<typeof innerScan>) => {
  if (typeof window !== 'undefined') {
    ReactScanInternals.runInAllEnvironments = true;
    innerScan(...params);
  }
};
