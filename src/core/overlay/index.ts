import { ReactScanInternals } from '..';
import type { Render } from '../monitor';

export const handleRenders = (renders: Render[]) => {
  ReactScanInternals.renders = renders;
};
