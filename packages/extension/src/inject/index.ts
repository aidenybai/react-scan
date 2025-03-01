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
    enabled: isEnabled,
    showToolbar: isEnabled,
    dangerouslyForceRunInProduction: true,
    ...storedOptions,
  };
};

const initializeReactScan = async () => {
  const options = await getInitialOptions();

  window.hideIntro = true;
  reactScan.scan(options);
  window.reactScan = undefined;

  busDispatch<IEvents['react-scan:send-to-background']>(
    'react-scan:send-to-background',
    {
      type: 'react-scan:is-enabled',
      data: {
        state: options.showToolbar,
      },
    },
  );
};

const updateReactScanState = async (isEnabled: boolean | null) => {
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
  reactScan.setOptions(updatedOptions);

  busDispatch<IEvents['react-scan:send-to-background']>(
    'react-scan:send-to-background',
    {
      type: 'react-scan:is-enabled',
      data: {
        state: toggledState,
      },
    },
  );
};

void initializeReactScan();

window.addEventListener('DOMContentLoaded', async () => {
  if (!canLoadReactScan) {
    return;
  }

  let isReactAvailable = false;

  void (async () => {
    await sleep(1000);
    isReactAvailable = await hasReactFiber();

    if (!isReactAvailable) {
      reactScan.setOptions({
        enabled: false,
        showToolbar: false,
      });
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
    }
  })();

  const isReactScanExist = window.reactScan;
  if (isReactScanExist) {
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
  }

  window.reactScan = reactScan.setOptions;

  busSubscribe<IEvents['react-scan:toggle-state']>(
    'react-scan:toggle-state',
    async () => {
      if (!isReactAvailable || isReactScanExist) {
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
