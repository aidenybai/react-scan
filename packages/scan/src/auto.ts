import './polyfills';
// Prioritize bippy side-effect
import 'bippy';

import { IS_CLIENT } from '~web/utils/constants';
import { scan } from './index';

if (IS_CLIENT) {
  scan({
    dangerouslyForceRunInProduction: true
  });
  window.reactScan = scan;
}

export * from './core';
