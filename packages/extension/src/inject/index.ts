import * as reactScan from 'react-scan';
import { gt } from 'semver';
import type { IEvents } from '~types/messages';
import { EXTENSION_STORAGE_KEY, STORAGE_KEY } from '~utils/constants';
import {
  busDispatch,
  busSubscribe,
  canLoadReactScan,
  hasReactFiber,
  readLocalStorage,
  saveLocalStorage,
  sleep,
  storageGetItem,
  storageSetItem,
} from '~utils/helpers';
import { createNotificationUI, toggleNotification } from './notification';

const reactScanExtensionVersion = 'version' in reactScan.ReactScanInternals ? (reactScan.ReactScanInternals as any).version  : undefined;
const isTargetPageAlreadyUsedReactScan = () => {
  const currentReactScanVersion = window.__REACT_SCAN_VERSION__;

  if (
    window.__REACT_SCAN__?.ReactScanInternals?.Store?.monitor?.value &&
    !currentReactScanVersion
  ) {
    return true;
  }

  if (!reactScanExtensionVersion || !currentReactScanVersion) {
    return false;
  }

  return gt(currentReactScanVersion, reactScanExtensionVersion);
};

const getInitialOptions = async (): Promise<reactScan.Options> => {
  const storedOptions = readLocalStorage<reactScan.Options>(STORAGE_KEY);
  let isEnabled = false;

  try {
    const storedEnabled = await storageGetItem<boolean>(
      EXTENSION_STORAGE_KEY,
      'isEnabled',
    );
    isEnabled = storedEnabled ?? false;
  } catch {}

  return {
    ...storedOptions,
    enabled: isEnabled,
    showToolbar: isEnabled,
    dangerouslyForceRunInProduction: true,
  };
};

const initializeReactScan = async () => {
  const options = await getInitialOptions();

  window.__REACT_SCAN_EXTENSION__ = true;
  if (options.enabled) {
    window.hideIntro = true;
    reactScan.scan(options);
    window.reactScan = undefined;
  }
};

let timer: number | undefined;
const updateReactScanState = async (isEnabled: boolean | null) => {
  clearTimeout(timer);
  const toggledState = isEnabled === null ? true : !isEnabled;

  try {
    await storageSetItem(EXTENSION_STORAGE_KEY, 'isEnabled', toggledState);
  } catch {}

  const storedOptions = readLocalStorage<reactScan.Options>(STORAGE_KEY) ?? {};
  const updatedOptions = {
    ...storedOptions,
    enabled: toggledState,
    showToolbar: toggledState,
    dangerouslyForceRunInProduction: true,
  };

  saveLocalStorage(STORAGE_KEY, updatedOptions);

  window.location.reload();
};

void initializeReactScan();

window.addEventListener('DOMContentLoaded', async () => {
  if (!canLoadReactScan) {
    return;
  }

  let isReactAvailable = false;

  await sleep(1000);
  isReactAvailable = await hasReactFiber();

  if (!isReactAvailable) {
    createNotificationUI({
      title: 'React Not Detected',
      content:
        "React is not detected on this page.\nPlease ensure you're visiting a React application.",
    });

    busDispatch<IEvents['react-scan:send-to-background']>(
      'react-scan:send-to-background',
      {
        topic: 'react-scan:send-to-background',
        message: {
          type: 'react-scan:is-enabled',
          data: {
            state: false,
          },
        },
      },
    );

    busSubscribe<IEvents['react-scan:toggle-state']>(
      'react-scan:toggle-state',
      async () => {
        toggleNotification();
      },
    );

    return;
  }

  if (isTargetPageAlreadyUsedReactScan()) {
    if (window.__REACT_SCAN__?.ReactScanInternals?.Store?.monitor?.value) {
      createNotificationUI({
        title: 'Outdated React Scan Monitoring',
        content:
          'If you are a developer of this website, please upgrade to the latest version of React Scan.',
      });
    } else {
      createNotificationUI({
        title: 'Already Initialized',
        content: 'React Scan is already initialized on this page.',
      });
    }

    busDispatch<IEvents['react-scan:send-to-background']>(
      'react-scan:send-to-background',
      {
        topic: 'react-scan:send-to-background',
        message: {
          type: 'react-scan:is-enabled',
          data: {
            state: false,
          },
        },
      },
    );

    busSubscribe<IEvents['react-scan:toggle-state']>(
      'react-scan:toggle-state',
      async () => {
        toggleNotification();
      },
    );

    return;
  }

  const storedOptions = readLocalStorage<reactScan.Options>(STORAGE_KEY);
  if (storedOptions !== null) {
    busDispatch<IEvents['react-scan:send-to-background']>(
      'react-scan:send-to-background',
      {
        topic: 'react-scan:send-to-background',
        message: {
          type: 'react-scan:is-enabled',
          data: {
            state: storedOptions.showToolbar,
          },
        },
      },
    );
  }

  if (!isTargetPageAlreadyUsedReactScan()) {
    window.reactScan = reactScan.setOptions;
  }

  busSubscribe<IEvents['react-scan:toggle-state']>(
    'react-scan:toggle-state',
    async () => {
      if (!isReactAvailable || isTargetPageAlreadyUsedReactScan()) {
        toggleNotification();
        return;
      }

      try {
        const isEnabled = await storageGetItem<boolean>(
          EXTENSION_STORAGE_KEY,
          'isEnabled',
        );
        await updateReactScanState(!!isEnabled);
      } catch {
        await updateReactScanState(null);
      }
    },
  );
});
