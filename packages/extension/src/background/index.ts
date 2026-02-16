import browser from 'webextension-polyfill';
import { isInternalUrl } from '~utils/helpers';
import { IconState, updateIconForTab } from './icon';
import { BroadcastMessage } from '~types/messages';

const browserAction = browser.action || browser.browserAction;

const injectScripts = async (tabId: number) => {
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['src/content/index.js', 'src/inject/index.js'],
    });

    await browser.tabs.sendMessage(tabId, {
      type: 'react-scan:page-reload',
    });
  } catch (e) {
    // oxlint-disable-next-line no-console
    console.error('Script injection error:', e);
  }
};

const isScriptsLoaded = async (tabId: number): Promise<boolean> => {
  try {
    await browser.tabs.sendMessage(tabId, { type: 'react-scan:ping' });
    return true;
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
    await injectScripts(tab.id);
  }

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
    await browser.tabs.sendMessage(tab.id, {
      type: 'react-scan:toggle-state',
    });

    await updateIconForTab(tab, IconState.DISABLED);
  } catch {
    if (tab.id) {
      await updateIconForTab(tab, IconState.DISABLED);
    }
  }
});

browser.runtime.onMessage.addListener(
  (message: unknown, sender: browser.Runtime.MessageSender) => {
    const msg = message as BroadcastMessage;
    if (!sender.tab?.id) return;
    if (msg.type === 'react-scan:is-enabled') {
      void updateIconForTab(
        sender.tab,
        msg.data?.state ? IconState.ENABLED : IconState.DISABLED,
      );
    }
  },
);
