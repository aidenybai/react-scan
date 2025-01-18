import browser from 'webextension-polyfill';
import { isInternalUrl } from '../utils/helpers';
import { updateIcon } from './icon';

const browserAction = browser.action || browser.browserAction;

const isScriptsLoaded = async (tabId: number): Promise<boolean> => {
  try {
    const response = await browser.tabs.sendMessage(tabId, { type: 'react-scan:ping' });
    return response?.pong === true;
  } catch {
    return false;
  }
};

const init = async (tab: browser.Tabs.Tab) => {
  if (!tab.id || !tab.url || isInternalUrl(tab.url)) {
    await updateIcon(false);
    return;
  }

  const isLoaded = await isScriptsLoaded(tab.id);
  if (!isLoaded) {
    await updateIcon(false);
  }
};

// Listen for tab updates - only handle complete state
browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    void init(tab);
  }
});

// Listen for tab activation (when switching tabs)
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  void init(tab);
});

// Listen for window focus
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    const [tab] = await browser.tabs.query({ active: true, windowId });
    if (tab) {
      void init(tab);
    }
  }
});

// Initialize on extension load
browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab) {
    void init(tab);
  }
});

// Handle extension icon click
browserAction.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || isInternalUrl(tab.url)) {
    await updateIcon(false);
    return;
  }

  void updateIcon(false);

  await browser.tabs.sendMessage(tab.id, {
    type: 'react-scan:toggle-state',
  });
});
