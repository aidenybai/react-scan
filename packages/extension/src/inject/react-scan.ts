import * as reactScan from 'react-scan';
import { canLoadReactScan, readLocalStorage } from '../utils/helpers';

window.isReactScanExtension = true;
window.reactScan = reactScan.setOptions;
globalThis._reactScan = reactScan;

if (canLoadReactScan) {
  reactScan.scan({ enabled: false, showToolbar: false });
}
