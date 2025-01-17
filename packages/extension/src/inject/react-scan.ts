import { installRDTHook } from 'bippy';
import { canLoadReactScan, saveLocalStorage } from '../utils/helpers';

saveLocalStorage('useExtensionWorker', true);

if (canLoadReactScan) {
  installRDTHook();
}
