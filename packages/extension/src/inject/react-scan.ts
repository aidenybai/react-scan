import * as reactScan from 'react-scan';
import { canLoadReactScan, saveLocalStorage } from '../utils/helpers';

saveLocalStorage('useExtensionWorker', true);
window.reactScan = reactScan.setOptions;
globalThis._reactScan = reactScan;

if (canLoadReactScan) {
  reactScan.scan({
    enabled: true,
    showToolbar: false,
  });
}
