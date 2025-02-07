import { storageGetItem, storageSetItem } from '@pivanov/utils';
import type { Options } from 'react-scan';
import browser from 'webextension-polyfill';
import { BroadcastSchema } from '../types/messages';
import {
  broadcast,
  readLocalStorage,
  saveLocalStorage,
} from '../utils/helpers';

chrome.runtime.onMessage.addListener(
  async (message: unknown, _sender, sendResponse) => {
    const result = BroadcastSchema.safeParse(message);
    if (!result.success) {
      return false;
    }

    const data = result.data;

    if (data.type === 'react-scan:ping') {
      sendResponse({ pong: true });
      return false;
    }

    if (data.type === 'react-scan:is-running') {
      const options = readLocalStorage<{
        enabled: boolean;
        showToolbar: boolean;
      }>('react-scan-options');
      const response = { isRunning: options?.enabled && options?.showToolbar };
      sendResponse(response);
      return false;
    }

    if (data.type === 'react-scan:toggle-state') {
      const isEnabled = await storageGetItem<boolean>(
        'react-scan-extension',
        'isEnabled',
      );

      let toggledState = true;

      if (isEnabled !== null) {
        toggledState = !isEnabled;
      }

      void storageSetItem('react-scan-extension', 'isEnabled', toggledState);

      const options = readLocalStorage<Options>('react-scan-options');
      saveLocalStorage('react-scan-options', {
        ...options,
        enabled: isEnabled,
        showToolbar: isEnabled,
      });

      broadcast.onmessage = (type, data) => {
        if (type === 'react-scan:react-version' && data.version) {
          sendResponse({ hasReact: toggledState });
        }
      };

      broadcast.postMessage('react-scan:toggle-state', { state: toggledState });
      return true;
    }

    return false;
  },
);

window.addEventListener('DOMContentLoaded', () => {
  broadcast.onmessage = (type, data) => {
    if (type === 'react-scan:is-focused') {
      browser.runtime.sendMessage({
        type: 'react-scan:is-focused',
        data: {
          state: data.state,
        },
      });
    }
  };
});
