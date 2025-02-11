import { installRDTHook } from 'bippy';
import { canLoadReactScan, saveLocalStorage } from '../utils/helpers';

saveLocalStorage('use-extension-worker', true);

if (canLoadReactScan) {
  installRDTHook();
}
