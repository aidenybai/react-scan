import { broadcast, canLoadReactScan, hasReactFiber } from '../utils/helpers';
import { sleep, storageGetItem, storageSetItem } from '@pivanov/utils'
import { createReactNotAvailableUI, toggleReactIsNotAvailable } from './react-is-not-available';


window.addEventListener('DOMContentLoaded', async () => {

  if (!canLoadReactScan) {
    return;
  }

  // Wait for React to load
  await sleep(1000);
  const isReactAvailable = hasReactFiber();

  if (!isReactAvailable) {
    _reactScan.setOptions({
      enabled: false,
      showToolbar: false
    });
    createReactNotAvailableUI();
  }

  const isDefaultEnabled = await storageGetItem<boolean>('react-scan', 'enabled');
  _reactScan.setOptions({
    enabled: !!isDefaultEnabled,
    showToolbar: !!isDefaultEnabled
  });

  broadcast.onmessage = async (type, data) => {
    if (type === 'react-scan:toggle-state') {
      broadcast.postMessage('react-scan:react-version', {
        version: isReactAvailable
      });

      if (isReactAvailable) {
        const state = data?.state;
        _reactScan.setOptions({
          enabled: state,
          showToolbar: state
        });
        void storageSetItem('react-scan', 'enabled', state);
      } else {
        toggleReactIsNotAvailable();
      }
    }
  };

  _reactScan.ReactScanInternals.Store.inspectState.subscribe((state) => {
    broadcast.postMessage('react-scan:is-focused', {
      state: state.kind === 'focused'
    });
  });
});
