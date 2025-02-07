import { signal } from '@preact/signals';
import {
  LOCALSTORAGE_KEY,
  MIN_CONTAINER_WIDTH,
  MIN_SIZE,
  SAFE_AREA,
} from './constants';
import { readLocalStorage, saveLocalStorage } from './utils/helpers';
import type { Corner, WidgetConfig, WidgetSettings } from './widget/types';

export const signalIsSettingsOpen = signal(false);
export const signalRefWidget = signal<HTMLDivElement | null>(null);

export const defaultWidgetConfig = {
  corner: 'top-left' as Corner,
  dimensions: {
    isFullWidth: false,
    isFullHeight: false,
    width: MIN_SIZE.width,
    height: MIN_SIZE.height,
    position: { x: SAFE_AREA, y: SAFE_AREA },
  },
  lastDimensions: {
    isFullWidth: false,
    isFullHeight: false,
    width: MIN_SIZE.width,
    height: MIN_SIZE.height,
    position: { x: SAFE_AREA, y: SAFE_AREA },
  },
  componentsTree: {
    width: MIN_CONTAINER_WIDTH,
  },
} as WidgetConfig;

export const getInitialWidgetConfig = (): WidgetConfig => {
  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY);
  if (!stored) {
    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: defaultWidgetConfig.corner,
      dimensions: defaultWidgetConfig.dimensions,
      lastDimensions: defaultWidgetConfig.lastDimensions,
      componentsTree: defaultWidgetConfig.componentsTree,
    });

    return defaultWidgetConfig;
  }

  return {
    corner: stored.corner ?? defaultWidgetConfig.corner,
    dimensions: {
      isFullWidth: false,
      isFullHeight: false,
      width: MIN_SIZE.width,
      height: MIN_SIZE.height,
      position:
        stored.dimensions.position ?? defaultWidgetConfig.dimensions.position,
    },
    lastDimensions: stored.dimensions ?? defaultWidgetConfig.dimensions,
    componentsTree: stored.componentsTree ?? defaultWidgetConfig.componentsTree,
  };
};

export const signalWidget = signal<WidgetConfig>(getInitialWidgetConfig());

export const updateDimensions = (): void => {
  if (typeof window === 'undefined') return;

  const { dimensions } = signalWidget.value;
  const { width, height, position } = dimensions;

  signalWidget.value = {
    ...signalWidget.value,
    dimensions: {
      isFullWidth: width >= window.innerWidth - SAFE_AREA * 2,
      isFullHeight: height >= window.innerHeight - SAFE_AREA * 2,
      width,
      height,
      position,
    },
  };
};

export interface SlowDowns {
  slowDowns: number;
  hideNotification: boolean;
}

export const signalSlowDowns = signal<SlowDowns>({
  slowDowns: 0,
  hideNotification: false,
});

export type WidgetStates =
  | {
      view: 'none';
    }
  | {
      view: 'inspector';
      // extra params
    }
  | {
      view: 'settings';
      // extra params
    }
  | {
      view: 'slow-downs';
      // extra params
    }
  | {
      view: 'summary';
      // extra params
    };
export const signalWidgetViews = signal<WidgetStates>({
  view: 'none',
});
