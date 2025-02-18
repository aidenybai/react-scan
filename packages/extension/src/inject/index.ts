import { sleep, storageGetItem } from '@pivanov/utils';
import * as reactScan from 'react-scan';
import type { Options } from 'react-scan';
import { broadcast, canLoadReactScan, hasReactFiber } from '../utils/helpers';
import {
  createReactNotAvailableUI,
  toggleReactIsNotAvailable,
} from './react-is-not-available';


window.reactScan = reactScan.setOptions;

storageGetItem<boolean>('react-scan-extension', 'isEnabled').then(
  (isEnabled) => {
    const options: Partial<Options> = {
      enabled: false,
      showToolbar: false,
      dangerouslyForceRunInProduction: true,
    };

    if (isEnabled !== null) {
      options.enabled = isEnabled;
      options.showToolbar = isEnabled;
    }

    reactScan.scan(options);
  },
);


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

  broadcast.onmessage = async (type, data) => {
    if (type === 'react-scan:toggle-state') {
      broadcast.postMessage('react-scan:react-version', {
        version: isReactAvailable,
      });

      if (isReactAvailable) {
        const isEnabled = data?.state;

        reactScan.setOptions({
          enabled: isEnabled,
          showToolbar: isEnabled,
        });
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
