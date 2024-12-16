import { signal } from '@preact/signals';
import { readLocalStorage, saveLocalStorage } from '@web-utils/helpers';
import { type WidgetConfig, type WidgetSettings, type Corner } from './components/widget/types';
import { LOCALSTORAGE_KEY, MIN_SIZE, SAFE_AREA } from './constants';

export const signalRefContainer = signal<HTMLDivElement | null>(null);

const getInitialWidgetConfig = (): WidgetConfig => {
  if (typeof window === 'undefined') {
    return {
      isResizing: false,
      corner: 'top-left' as Corner,
      dimensions: {
        isFullWidth: false,
        isFullHeight: false,
        width: MIN_SIZE.width,
        height: MIN_SIZE.height,
        position: { x: SAFE_AREA, y: SAFE_AREA }
      },
      lastDimensions: {
        isFullWidth: false,
        isFullHeight: false,
        width: MIN_SIZE.width,
        height: MIN_SIZE.height * 12,
        position: { x: SAFE_AREA, y: SAFE_AREA }
      }
    };
  }

  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY);
  if (!stored) {
    const defaultConfig: WidgetConfig = {
      isResizing: false,
      corner: 'top-left' as Corner,
      dimensions: {
        isFullWidth: false,
        isFullHeight: false,
        width: MIN_SIZE.width,
        height: MIN_SIZE.height,
        position: { x: 24, y: 24 }
      },
      lastDimensions: {
        isFullWidth: false,
        isFullHeight: false,
        width: 360,
        height: 240,
        position: { x: 24, y: 24 }
      }
    };

    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: defaultConfig.corner,
      dimensions: defaultConfig.dimensions,
      lastDimensions: defaultConfig.lastDimensions
    });

    return defaultConfig;
  }

  return {
    isResizing: false,
    corner: stored.corner,
    dimensions: stored.dimensions,
    lastDimensions: stored.lastDimensions
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
      isFullWidth: width >= window.innerWidth - (SAFE_AREA * 2),
      isFullHeight: height >= window.innerHeight - (SAFE_AREA * 2),
      width,
      height,
      position
    }
  };
};
