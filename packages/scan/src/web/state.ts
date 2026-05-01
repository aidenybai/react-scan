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
import { getSafeArea } from "./utils/safe-area";
import type { Corner, WidgetConfig, WidgetSettings } from "./widget/types";
import type { CollapsedPosition } from "./widget/types";

export const signalIsSettingsOpen = /* @__PURE__ */ signal(false);
export const signalRefWidget = /* @__PURE__ */ signal<HTMLDivElement | null>(
  null
);

// Use the raw SAFE_AREA constant (not getSafeArea()) here: this runs at
// module-init time, before any user has called scan() with options.
export const getDefaultWidgetConfig = (): WidgetConfig => ({
  corner: "bottom-right" satisfies Corner,
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
});

// Deprecated alias kept for one minor version to avoid breaking downstream
// imports of the pre-refactor `defaultWidgetConfig` const.
/** @deprecated use {@link getDefaultWidgetConfig} */
export const defaultWidgetConfig: WidgetConfig = getDefaultWidgetConfig();

export const getInitialWidgetConfig = (): WidgetConfig => {
  const defaults = getDefaultWidgetConfig();
  const stored = readLocalStorage<WidgetSettings>(LOCALSTORAGE_KEY);
  if (!stored) {
    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: defaults.corner,
      dimensions: defaults.dimensions,
      lastDimensions: defaults.lastDimensions,
      componentsTree: defaults.componentsTree,
    });

    return defaults;
  }

  return {
    corner: stored.corner ?? defaults.corner,
    dimensions: stored.dimensions ?? defaults.dimensions,

    lastDimensions:
      stored.lastDimensions ??
      stored.dimensions ??
      defaults.lastDimensions,
    componentsTree: stored.componentsTree ?? defaults.componentsTree,
  };
};

export const signalWidget = signal<WidgetConfig>(getInitialWidgetConfig());

export const updateDimensions = (): void => {
  if (!IS_CLIENT) return;

  const { dimensions } = signalWidget.value;
  const { width, height, position } = dimensions;
  const safeArea = getSafeArea();

  signalWidget.value = {
    ...signalWidget.value,
    dimensions: {
      isFullWidth: width >= window.innerWidth - safeArea.left - safeArea.right,
      isFullHeight: height >= window.innerHeight - safeArea.top - safeArea.bottom,
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
