import {
  busDispatch,
  busSubscribe,
  sleep,
  storageGetItem,
  storageSetItem,
} from '@pivanov/utils';
import * as reactScan from 'react-scan';
import type { IEvents } from '~types/messages';
import { EXTENSION_STORAGE_KEY, STORAGE_KEY } from '~utils/constants';
import {
  canLoadReactScan,
  hasReactFiber,
  readLocalStorage,
  saveLocalStorage,
} from '~utils/helpers';
import { createNotificationUI, toggleNotification } from './notification';

export const isTargetPageAlreadyUsedReactScan = () => {
  const reactScanExtensionVersion = reactScan.ReactScanInternals.version;
  const currentReactScanVersion =
    window.__REACT_SCAN__?.ReactScanInternals.version;

  if (window.__REACT_SCAN__?.ReactScanInternals.Store.monitor.value) {
    return false;
  }

  return (
    !!window.__REACT_SCAN__ &&
    reactScanExtensionVersion !== currentReactScanVersion
  );
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

  window.hideIntro = true;
  reactScan.scan(options);
  window.reactScan = undefined;
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
    createNotificationUI();

    busDispatch<IEvents['react-scan:send-to-background']>(
      'react-scan:send-to-background',
      {
        type: 'react-scan:is-enabled',
        data: {
          state: false,
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
    createNotificationUI('React Scan is already initialized!');

    busDispatch<IEvents['react-scan:send-to-background']>(
      'react-scan:send-to-background',
      {
        type: 'react-scan:is-enabled',
        data: {
          state: false,
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
        type: 'react-scan:is-enabled',
        data: {
          state: storedOptions.showToolbar,
        },
      },
    );
  }

  window.reactScan = reactScan.setOptions;

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
        await updateReactScanState(isEnabled);
      } catch {
        await updateReactScanState(null);
      }
    },
  );
});
