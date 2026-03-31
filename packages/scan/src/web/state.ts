import { signal } from "@preact/signals";
import {
  LOCALSTORAGE_KEY,
  MIN_CONTAINER_WIDTH,
  MIN_SIZE,
  SAFE_AREA,
  LOCALSTORAGE_COLLAPSED_KEY,
} from "./constants";
import { IS_CLIENT } from "./utils/constants";
import { readLocalStorage, saveLocalStorage } from "./utils/helpers";
import type { Corner, WidgetConfig, WidgetSettings } from "./widget/types";
import type { CollapsedPosition } from "./widget/types";
import { calculatePosition } from "./widget/helpers";

export const signalIsSettingsOpen = /* @__PURE__ */ signal(false);
export const signalRefWidget = /* @__PURE__ */ signal<HTMLDivElement | null>(
  null
);

export const defaultWidgetConfig = {
  corner: "bottom-right" as Corner,
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

  // If user has previously moved the toolbar, respect their saved position
  if (stored) {
    return {
      corner: stored.corner ?? defaultWidgetConfig.corner,
      dimensions: stored.dimensions ?? defaultWidgetConfig.dimensions,
      lastDimensions:
        stored.lastDimensions ??
        stored.dimensions ??
        defaultWidgetConfig.lastDimensions,
      componentsTree: stored.componentsTree ?? defaultWidgetConfig.componentsTree,
    };
  }

  // No saved position — check if a programmatic toolbarPosition was set
  // We need to defer reading from ReactScanInternals here because at module
  // load time the options may not be set yet. The actual position application
  // happens in applyToolbarPosition() which is called after options are set.
  saveLocalStorage(LOCALSTORAGE_KEY, {
    corner: defaultWidgetConfig.corner,
    dimensions: defaultWidgetConfig.dimensions,
    lastDimensions: defaultWidgetConfig.lastDimensions,
    componentsTree: defaultWidgetConfig.componentsTree,
  });

  return defaultWidgetConfig;
};

/**
 * Called after options are set to apply toolbarPosition config.
 * Only applies if the user hasn't manually moved the toolbar (no localStorage).
 */
export const applyToolbarPosition = (corner: Corner, offsetX = 0, offsetY = 0): void => {
  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY);
  // Only override if the stored corner is still the default (user hasn't dragged)
  if (stored && stored.corner !== defaultWidgetConfig.corner) {
    return;
  }

  const position = calculatePosition(corner, MIN_SIZE.width, MIN_SIZE.height, offsetX, offsetY);

  const newConfig: WidgetConfig = {
    corner,
    dimensions: {
      ...defaultWidgetConfig.dimensions,
      position,
    },
    lastDimensions: {
      ...defaultWidgetConfig.lastDimensions,
      position,
    },
    componentsTree: defaultWidgetConfig.componentsTree,
  };

  signalWidget.value = newConfig;
  saveLocalStorage(LOCALSTORAGE_KEY, newConfig);
};

export const signalWidget = signal<WidgetConfig>(getInitialWidgetConfig());

export const updateDimensions = (): void => {
  if (!IS_CLIENT) return;

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

export type WidgetStates =
  | {
      view: "none";
    }
  | {
      view: "inspector";
      // extra params
    }
  // | {
  //     view: 'settings';
  //     // extra params
  //   }
  | {
      view: "notifications";
      // extra params
    };
// | {
//     view: 'summary';
//     // extra params
//   };
export const signalWidgetViews = signal<WidgetStates>({
  view: "none",
});

const storedCollapsed = readLocalStorage<CollapsedPosition | null>(
  LOCALSTORAGE_COLLAPSED_KEY
);
export const signalWidgetCollapsed =
  /* @__PURE__ */ signal<CollapsedPosition | null>(storedCollapsed ?? null);
