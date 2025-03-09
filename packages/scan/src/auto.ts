// Prioritize bippy side-effect
import { getRDTHook } from 'bippy';

import { IS_CLIENT } from '~web/utils/constants';
import { scan } from './index';

if (IS_CLIENT) {
  getRDTHook();
  scan();
  window.reactScan = scan;
}

export * from './core';
