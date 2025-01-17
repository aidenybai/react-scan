import { sleep, storageGetItem, storageSetItem } from '@pivanov/utils';
import * as reactScan from 'react-scan';
import { broadcast, canLoadReactScan, hasReactFiber } from '../utils/helpers';
import { createReactNotAvailableUI, toggleReactIsNotAvailable } from './react-is-not-available';

console.log('@@@ 2');
window.reactScan = reactScan.setOptions;

reactScan.scan({
  enabled: false,
  showToolbar: true,
});


window.addEventListener('DOMContentLoaded', async () => {
  if (!canLoadReactScan) {
    return;
  }

  // Wait for React to load
  await sleep(1000);
  const isReactAvailable = hasReactFiber();

  if (!isReactAvailable) {
    reactScan.setOptions({
      enabled: false,
      showToolbar: false,
    });
    createReactNotAvailableUI();
  }

  const isDefaultEnabled = await storageGetItem<boolean>(
    'react-scan',
    'enabled',
  );
  reactScan.setOptions({
    enabled: !!isDefaultEnabled,
    showToolbar: !!isDefaultEnabled,
  });

  broadcast.onmessage = async (type, data) => {
    if (type === 'react-scan:toggle-state') {
      broadcast.postMessage('react-scan:react-version', {
        version: isReactAvailable,
      });

      if (isReactAvailable) {
        const state = data?.state;
        reactScan.setOptions({
          enabled: state,
          showToolbar: state,
        });
        void storageSetItem('react-scan', 'enabled', state);
      } else {
        toggleReactIsNotAvailable();
      }
    }
  };

  reactScan.ReactScanInternals.Store.inspectState.subscribe((state) => {
    broadcast.postMessage('react-scan:is-focused', {
      state: state.kind === 'focused',
    });
  });
});
