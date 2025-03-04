import { busDispatch, busSubscribe, storageSetItem } from '@pivanov/utils';
import browser from 'webextension-polyfill';
import {
  type BroadcastMessage,
  BroadcastSchema,
  type IEvents,
} from '~types/messages';
import { saveLocalStorage } from '../utils/helpers';
import { EXTENSION_STORAGE_KEY, STORAGE_KEY } from '../utils/constants';


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

    if (data.type === 'react-scan:toggle-state') {
      // Adter extension installation
      const needsRefresh = localStorage.getItem('react-scan-needs-refresh');
      if (needsRefresh === 'true') {
        localStorage.removeItem('react-scan-needs-refresh');
        try {
          await storageSetItem(EXTENSION_STORAGE_KEY, 'isEnabled', true);
        } catch {}

        const updatedOptions = {
          enabled: true,
          showToolbar: true,
          dangerouslyForceRunInProduction: true,
        };

        saveLocalStorage(STORAGE_KEY, updatedOptions);

        window.location.reload();
        return;
      }

      busDispatch<IEvents['react-scan:toggle-state']>(
        'react-scan:toggle-state',
        undefined,
      );
      return false;
    }

    return false;
  },
);

const sendMessageToBackground = ({ type, data }: BroadcastMessage) => {
  try {
    return browser.runtime.sendMessage({ type, data });
  } catch {
    return Promise.resolve();
  }
};

busSubscribe<IEvents['react-scan:send-to-background']>(
  'react-scan:send-to-background',
  (message) => {
    sendMessageToBackground(message);
  },
);
