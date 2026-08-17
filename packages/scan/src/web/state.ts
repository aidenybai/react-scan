import { createSignal } from "solid-js";
import {
  LOCALSTORAGE_KEY,
  LOCALSTORAGE_TOOLBAR_STATE_KEY,
  MIN_CONTAINER_WIDTH,
  MIN_SIZE,
  SAFE_AREA,
  TOOLBAR_DEFAULT_POSITION_RATIO,
} from "./constants";
import { readLocalStorage, saveLocalStorage } from "./utils/helpers";
import type { Corner, SnapEdge, ToolbarState, WidgetConfig, WidgetSettings } from "./widget/types";

export const [getWidgetRef, setWidgetRef] = createSignal<HTMLDivElement | null>(null);

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

const getInitialWidgetConfig = (): WidgetConfig => {
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

    lastDimensions: stored.lastDimensions ?? stored.dimensions ?? defaults.lastDimensions,
    componentsTree: stored.componentsTree ?? defaults.componentsTree,
  };
};

export const [getWidgetState, setWidgetState] =
  createSignal<WidgetConfig>(getInitialWidgetConfig());

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
export const [getWidgetView, setWidgetView] = createSignal<WidgetStates>({
  view: "none",
});

const isSnapEdge = (edge: unknown): edge is SnapEdge =>
  edge === "top" || edge === "bottom" || edge === "left" || edge === "right";

const getInitialToolbarState = (): ToolbarState => {
  const stored = readLocalStorage<Partial<ToolbarState>>(LOCALSTORAGE_TOOLBAR_STATE_KEY);
  return {
    edge: isSnapEdge(stored?.edge) ? stored.edge : "bottom",
    ratio: typeof stored?.ratio === "number" ? stored.ratio : TOOLBAR_DEFAULT_POSITION_RATIO,
    collapsed: stored?.collapsed === true,
  };
};

export const [getToolbarState, setToolbarState] =
  createSignal<ToolbarState>(getInitialToolbarState());

export const updateToolbarState = (update: (state: ToolbarState) => ToolbarState): void => {
  const nextState = update(getToolbarState());
  setToolbarState(nextState);
  saveLocalStorage(LOCALSTORAGE_TOOLBAR_STATE_KEY, nextState);
};
