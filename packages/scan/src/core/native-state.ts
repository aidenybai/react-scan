import type { Fiber } from "bippy";
import { createCompatibleSignal } from "./compatibility";
import type { Options, StoreType } from "./index";
import type { States } from "./inspection/types";
import type { RenderData } from "./utils";
import { IS_CLIENT } from "../utils/is-client";

const wasDetailsOpenState = createCompatibleSignal(true);
const isInIframeState = createCompatibleSignal(IS_CLIENT && window.self !== window.top);
const inspectState = createCompatibleSignal<States>({ kind: "uninitialized" });
const lastReportTimeState = createCompatibleSignal(0);
const optionsState = createCompatibleSignal<Options>({
  enabled: true,
  log: false,
  showToolbar: true,
  animationSpeed: "fast",
  dangerouslyForceRunInProduction: false,
  showFPS: true,
  showNotificationCount: true,
  allowInIframe: false,
});

export const getInspectState = inspectState.get;
export const setInspectState = inspectState.set;
export const getLastReportTime = lastReportTimeState.get;
export const setLastReportTime = lastReportTimeState.set;
export const getIsInIframe = isInIframeState.get;
export const getOptionsState = optionsState.get;
export const setOptionsState = optionsState.set;
export const optionsFacade = optionsState.facade;

export const Store: StoreType = {
  wasDetailsOpen: wasDetailsOpenState.facade,
  isInIframe: isInIframeState.facade,
  inspectState: inspectState.facade,
  fiberRoots: new Set<Fiber>(),
  reportData: new Map<number, RenderData>(),
  legacyReportData: new Map<string, RenderData>(),
  lastReportTime: lastReportTimeState.facade,
  interactionListeningForRenders: null,
  changesListeners: new Map(),
};
