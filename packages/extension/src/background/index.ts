import browser from 'webextension-polyfill';
import { STORAGE_KEY } from '../utils/constants';
import { isInternalUrl } from '../utils/helpers';
import { updateBadge } from './update-badge';


const changeCSPRules = async (domain: string, isEnabled: boolean, tabId?: number) => {
  let currentDomains = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};

  if (isEnabled) {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['react_scan_csp_rules'],
    });
    currentDomains[domain] = true;
  } else {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['react_scan_csp_rules'],
    });
    const { [domain]: _, ...rest } = currentDomains;
    currentDomains = rest;
  }

  await browser.storage.local.set({ [STORAGE_KEY]: currentDomains });
  await updateBadge(isEnabled);

  if (tabId) {
    await browser.tabs.sendMessage(tabId, {
      type: 'CSP_RULES_CHANGED',
      data: {
        enabled: isEnabled,
        domain,
      },
    });
  }
};

// Handle extension icon click
browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || isInternalUrl(tab.url)) {
    return;
  }

  const checkReactVersion = async (tabId: number) => {
    const response = await new Promise<{ isReactDetected: boolean; version: string }>((resolve) => {
      browser.tabs.sendMessage(tabId, {
        type: 'CHECK_REACT_VERSION'
      }).then(resolve);
    });
    return response;
  };

  const isContentScriptInjected = async (tabId: number): Promise<boolean> => {
    try {
      await browser.tabs.sendMessage(tabId, { type: 'PING' });
      return true;
    } catch {
      return false;
    }
  };

  const injectContentScript = async (tabId: number) => {
    if (!tab.url?.startsWith('chrome://')) {
      const isInjected = await isContentScriptInjected(tabId);
      if (!isInjected) {
        await browser.scripting.executeScript({
          target: { tabId },
          files: ['src/content.js']
        });
      }
    }
  };

  try {
    // Always try to inject first
    await injectContentScript(tab.id);

    // Give it a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Then check React version
    const response = await checkReactVersion(tab.id);

    const domain = new URL(tab.url).origin;
    const currentDomains = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
    const isEnabled = domain in currentDomains && currentDomains[domain] === true;

    if (!response.isReactDetected) {
      // If React is not detected, ensure CSP rules are disabled
      if (isEnabled) {
        await changeCSPRules(domain, false, tab.id);
      }
      return;
    }

    // Enable or toggle CSP rules for React projects
    await changeCSPRules(domain, !isEnabled, tab.id);
  } catch (error) {
    // Silent fail
  }
});

// Handle CSP rules changes
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'CSP_RULES_CHANGED') {
    await changeCSPRules(message.data.domain, message.data.enabled);
  }

  if (message.type === 'IS_CSP_RULES_ENABLED') {
    const currentDomains = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
    const isEnabled = message.data.domain in currentDomains && currentDomains[message.data.domain] === true;
    return { enabled: isEnabled };
  }
});

const handleTabCSPRules = async (tab: browser.Tabs.Tab) => {
  if (!tab.id || !tab.url || isInternalUrl(tab.url)) {
    return;
  }

  const domain = new URL(tab.url).origin;
  const currentDomains = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
  const isEnabled = domain in currentDomains && currentDomains[domain] === true;

  if (isEnabled) {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['react_scan_csp_rules'],
    });
  } else {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['react_scan_csp_rules'],
    });
  }

  await updateBadge(isEnabled);
};

// Listen for tab updates
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await handleTabCSPRules(tab);
  }
});

// Listen for tab activation
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  await handleTabCSPRules(tab);
});

// Listen for window focus
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    const [tab] = await browser.tabs.query({ active: true, windowId });
    if (tab) {
      await handleTabCSPRules(tab);
    }
  }
});
