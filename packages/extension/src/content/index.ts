import browser from 'webextension-polyfill';
import {
  type BroadcastMessage,
  BroadcastSchema,
  type IEvents,
} from '~types/messages';
import { busDispatch, busSubscribe } from '~utils/helpers';

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

    if (data.type === 'react-scan:page-reload') {
      window.location.reload();
      return false;
    }

    if (data.type === 'react-scan:toggle-state') {
      busDispatch<IEvents['react-scan:toggle-state']>(
        'react-scan:toggle-state',
        {
          topic: 'react-scan:toggle-state',
          message: undefined,
        },
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
  (event) => {
    sendMessageToBackground(event.message);
  },
);
