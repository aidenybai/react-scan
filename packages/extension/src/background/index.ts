import browser from 'webextension-polyfill';
import { isInternalUrl } from '~utils/helpers';
import { IconState, updateIconForTab } from './icon';

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
    if (tab.id) {
      await updateIconForTab(tab, IconState.DISABLED);
    }
    return;
  }

  const isLoaded = await isScriptsLoaded(tab.id);
  if (!isLoaded) {
    await updateIconForTab(tab, IconState.DISABLED);
  }
};

browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    void init(tab);
  }
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  void init(tab);
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    const [tab] = await browser.tabs.query({ active: true, windowId });
    if (tab) {
      void init(tab);
    }
  }
});

browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab) {
    void init(tab);
  }
});

browserAction.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || isInternalUrl(tab.url)) {
    if (tab.id) {
      await updateIconForTab(tab, IconState.DISABLED);
    }
    return;
  }

  try {
    const response = await browser.tabs.sendMessage(tab.id, {
      type: 'react-scan:toggle-state',
    });

    if (response && typeof response.hasReact === 'boolean') {
      await updateIconForTab(
        tab,
        response.hasReact ? IconState.ENABLED : IconState.DISABLED,
      );
    } else {
      await updateIconForTab(tab, IconState.DISABLED);
    }
  } catch {
    if (tab.id) {
      await updateIconForTab(tab, IconState.DISABLED);
    }
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (!sender.tab?.id) return;
  if (message.type === 'react-scan:is-enabled') {
    void updateIconForTab(
      sender.tab,
      message.data.state ? IconState.ENABLED : IconState.DISABLED,
    );
  }
});
