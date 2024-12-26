import { broadcast, canLoadReactScan, getReactVersion } from '../utils/helpers';
import { createReactNotAvailableUI, toggleReactIsNotAvailable } from './react-is-not-available';

window.addEventListener('DOMContentLoaded', async () => {
  if (!canLoadReactScan) {
    return;
  }

  const isReactAvailable = await getReactVersion();
  if (!isReactAvailable) {
    _reactScan.setOptions({
      enabled: false,
      showToolbar: false
    });
    createReactNotAvailableUI();
  }

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
