import { IS_CLIENT } from '~web/utils/constants';
import { scan } from './index';
import { init } from './install-hook';

init();

if (IS_CLIENT) {
  scan();
  window.reactScan = scan;
}

export * from './core';
