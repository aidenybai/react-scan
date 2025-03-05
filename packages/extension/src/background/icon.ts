import browser from 'webextension-polyfill';

export enum IconState {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
}

const browserAction = browser.action || browser.browserAction;

const cachedIcons = {
  [IconState.ENABLED]: {
    path: {
      16: browser.runtime.getURL('icons/enabled/16.png'),
      32: browser.runtime.getURL('icons/enabled/32.png'),
      48: browser.runtime.getURL('icons/enabled/48.png'),
      128: browser.runtime.getURL('icons/enabled/128.png'),
    },
  },
  [IconState.DISABLED]: {
    path: {
      16: browser.runtime.getURL('icons/disabled/16.png'),
      32: browser.runtime.getURL('icons/disabled/32.png'),
      48: browser.runtime.getURL('icons/disabled/48.png'),
      128: browser.runtime.getURL('icons/disabled/128.png'),
    },
  },
};

export const updateIconForTab = async (
  tab: browser.Tabs.Tab,
  state: IconState,
  badgeText = 'on',
): Promise<void> => {
  try {
    switch (state) {
      case IconState.ENABLED:
        await browserAction.setIcon({
          tabId: tab.id,
          path: cachedIcons[IconState.ENABLED].path,
        });
        if (badgeText) {
          await browserAction.setBadgeText({ text: badgeText, tabId: tab.id });
          await browserAction.setBadgeBackgroundColor({
            color: '#A295EE',
            tabId: tab.id,
          });
        }
        break;

      default:
        await browserAction.setIcon({
          tabId: tab.id,
          path: cachedIcons[IconState.DISABLED].path,
        });
        await browserAction.setBadgeText({ text: '', tabId: tab.id });
        break;
    }
  } catch {}
};
