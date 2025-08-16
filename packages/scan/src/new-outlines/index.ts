import {
  type Fiber,
  didFiberCommit,
  getDisplayName,
  getFiberId,
  getNearestHostFibers,
  getTimings,
  getType,
  isCompositeFiber,
} from 'bippy';
import {
  Change,
  ContextChange,
  PropsChange,
  ReactScanInternals,
  Store,
  ignoredProps,
} from '~core/index';
import {
  ChangeReason,
  createInstrumentation,
  getContextChanges,
  getStateChanges,
  OldRenderData,
} from '~core/instrumentation';
import { log, logIntro } from '~web/utils/log';
import { inspectorUpdateSignal } from '~web/views/inspector/states';
import {
  OUTLINE_ARRAY_SIZE,
  drawCanvas,
  initCanvas,
  updateOutlines,
  updateScroll,
} from './canvas';
import type { ActiveOutline, BlueprintOutline, OutlineData } from './types';
import { getChangedPropsDetailed } from '~web/views/inspector/utils';

// The worker code will be replaced at build time
const workerCode = '__WORKER_CODE__';

let worker: Worker | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
let animationFrameId: number | null = null;
const activeOutlines = new Map<string, ActiveOutline>();

const blueprintMap = new Map<Fiber, BlueprintOutline>();
const blueprintMapKeys = new Set<Fiber>();

export const outlineFiber = (fiber: Fiber) => {
  if (!isCompositeFiber(fiber)) return;
  const name =
    typeof fiber.type === 'string' ? fiber.type : getDisplayName(fiber);
  if (!name) return;
  const blueprint = blueprintMap.get(fiber);
  const nearestFibers = getNearestHostFibers(fiber);
  const didCommit = didFiberCommit(fiber);

  if (!blueprint) {
    blueprintMap.set(fiber, {
      name,
      count: 1,
      elements: nearestFibers.map((fiber) => fiber.stateNode),
      didCommit: didCommit ? 1 : 0,
    });
    blueprintMapKeys.add(fiber);
  } else {
    blueprint.count++;
  }
};

const mergeRects = (rects: DOMRect[]) => {
  const firstRect = rects[0];
  if (rects.length === 1) return firstRect;

  let minX: number | undefined;
  let minY: number | undefined;
  let maxX: number | undefined;
  let maxY: number | undefined;

  for (let i = 0, len = rects.length; i < len; i++) {
    const rect = rects[i];
    minX = minX == null ? rect.x : Math.min(minX, rect.x);
    minY = minY == null ? rect.y : Math.min(minY, rect.y);
    maxX =
      maxX == null ? rect.x + rect.width : Math.max(maxX, rect.x + rect.width);
    maxY =
      maxY == null
        ? rect.y + rect.height
        : Math.max(maxY, rect.y + rect.height);
  }

  if (minX == null || minY == null || maxX == null || maxY == null) {
    return rects[0];
  }

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
};

interface IntersectionState {
  resolveNext: ((value: IntersectionObserverEntry[]) => void) | null;
  seenElements: Set<Element>;
  uniqueElements: Set<Element>;
  done: boolean;
}

function onIntersect(
  this: IntersectionState,
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) {
  const newEntries: IntersectionObserverEntry[] = [];

  for (const entry of entries) {
    const element = entry.target;
    if (!this.seenElements.has(element)) {
      this.seenElements.add(element);
      newEntries.push(entry);
    }
  }

  if (newEntries.length > 0 && this.resolveNext) {
    this.resolveNext(newEntries);
    this.resolveNext = null;
  }

  if (this.seenElements.size === this.uniqueElements.size) {
    observer.disconnect();
    this.done = true;
    if (this.resolveNext) {
      this.resolveNext([]);
    }
  }
}

export const getBatchedRectMap = async function* (
  elements: Element[],
): AsyncGenerator<IntersectionObserverEntry[], void, unknown> {
  const state: IntersectionState = {
    uniqueElements: new Set(elements),
    seenElements: new Set(),
    resolveNext: null,
    done: false,
  };
  const observer = new IntersectionObserver(onIntersect.bind(state));

  for (const element of state.uniqueElements) {
    observer.observe(element);
  }

  while (!state.done) {
    const entries = await new Promise<IntersectionObserverEntry[]>(
      (resolve) => {
        state.resolveNext = resolve;
      },
    );
    if (entries.length > 0) {
      yield entries;
    }
  }
};

const SupportedArrayBuffer =
  typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : ArrayBuffer;

export const flushOutlines = async () => {
  const elements: Element[] = [];

  for (const fiber of blueprintMapKeys) {
    const blueprint = blueprintMap.get(fiber);
    if (!blueprint) continue;
    for (let i = 0; i < blueprint.elements.length; i++) {
      if (!(blueprint.elements[i] instanceof Element)) {
        // TODO: filter this at the root
        continue;
      }
      elements.push(blueprint.elements[i]);
    }
  }

  const rectsMap = new Map<Element, DOMRect>();

  // TODO(Alexis): too complex, needs breakdown
  for await (const entries of getBatchedRectMap(elements)) {
    for (const entry of entries) {
      const element = entry.target;
      const rect = entry.intersectionRect;
      if (entry.isIntersecting && rect.width && rect.height) {
        rectsMap.set(element, rect);
      }
    }

    const blueprints: BlueprintOutline[] = [];
    const blueprintRects: DOMRect[] = [];
    const blueprintIds: number[] = [];

    for (const fiber of blueprintMapKeys) {
      const blueprint = blueprintMap.get(fiber);
      if (!blueprint) continue;

      const rects: DOMRect[] = [];
      for (let i = 0; i < blueprint.elements.length; i++) {
        const element = blueprint.elements[i];
        const rect = rectsMap.get(element);
        if (!rect) continue;
        rects.push(rect);
      }

      if (!rects.length) continue;

      blueprints.push(blueprint);
      blueprintRects.push(mergeRects(rects));
      blueprintIds.push(getFiberId(fiber));
    }

    if (blueprints.length > 0) {
      const arrayBuffer = new SupportedArrayBuffer(
        blueprints.length * OUTLINE_ARRAY_SIZE * 4,
      );
      const sharedView = new Float32Array(arrayBuffer);
      const blueprintNames = new Array(blueprints.length);
      let outlineData: OutlineData[] | undefined;

      for (let i = 0, len = blueprints.length; i < len; i++) {
        const blueprint = blueprints[i];
        const id = blueprintIds[i];
        const { x, y, width, height } = blueprintRects[i];
        const { count, name, didCommit } = blueprint;

        if (worker) {
          const scaledIndex = i * OUTLINE_ARRAY_SIZE;
          sharedView[scaledIndex] = id;
          sharedView[scaledIndex + 1] = count;
          sharedView[scaledIndex + 2] = x;
          sharedView[scaledIndex + 3] = y;
          sharedView[scaledIndex + 4] = width;
          sharedView[scaledIndex + 5] = height;
          sharedView[scaledIndex + 6] = didCommit;
          blueprintNames[i] = name;
        } else {
          outlineData ||= new Array(blueprints.length);
          outlineData[i] = {
            id,
            name,
            count,
            x,
            y,
            width,
            height,
            didCommit: didCommit as 0 | 1,
          };
        }
      }

      if (worker) {
        worker.postMessage({
          type: 'draw-outlines',
          data: arrayBuffer,
          names: blueprintNames,
        });
      } else if (canvas && ctx && outlineData) {
        updateOutlines(activeOutlines, outlineData);
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(draw);
        }
      }
    }
  }

  for (const fiber of blueprintMapKeys) {
    blueprintMap.delete(fiber);
    blueprintMapKeys.delete(fiber);
  }
};

const draw = () => {
  if (!ctx || !canvas) return;

  const shouldContinue = drawCanvas(ctx, canvas, dpr, activeOutlines);

  if (shouldContinue) {
    animationFrameId = requestAnimationFrame(draw);
  } else {
    animationFrameId = null;
  }
};

const IS_OFFSCREEN_CANVAS_WORKER_SUPPORTED =
  typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';

const getDpr = () => {
  return Math.min(window.devicePixelRatio || 1, 2);
};

export const getCanvasEl = () => {
  cleanup();
  const host = document.createElement('div');
  host.setAttribute('data-react-scan', 'true');
  const shadowRoot = host.attachShadow({ mode: 'open' });

  const canvasEl = document.createElement('canvas');
  canvasEl.style.position = 'fixed';
  canvasEl.style.top = '0';
  canvasEl.style.left = '0';
  canvasEl.style.pointerEvents = 'none';
  canvasEl.style.zIndex = '2147483646';
  canvasEl.setAttribute('aria-hidden', 'true');
  shadowRoot.appendChild(canvasEl);

  if (!canvasEl) return null;

  dpr = getDpr();
  canvas = canvasEl;

  const { innerWidth, innerHeight } = window;
  canvasEl.style.width = `${innerWidth}px`;
  canvasEl.style.height = `${innerHeight}px`;
  const width = innerWidth * dpr;
  const height = innerHeight * dpr;
  canvasEl.width = width;
  canvasEl.height = height;

  if (
    IS_OFFSCREEN_CANVAS_WORKER_SUPPORTED &&
    !window.__REACT_SCAN_EXTENSION__
  ) {
    try {
      worker = new Worker(
        URL.createObjectURL(
          new Blob([workerCode], { type: 'application/javascript' }),
        ),
        { name: "ReactScanRenderer" }
      );

      const offscreenCanvas = canvasEl.transferControlToOffscreen();
      worker?.postMessage(
        {
          type: 'init',
          canvas: offscreenCanvas,
          width: canvasEl.width,
          height: canvasEl.height,
          dpr,
        },
        [offscreenCanvas],
      );
    } catch (e) {
      // biome-ignore lint/suspicious/noConsole: Intended debug output
      console.warn('Failed to initialize OffscreenCanvas worker:', e);
    }
  }

  if (!worker) {
    ctx = initCanvas(canvasEl, dpr) as CanvasRenderingContext2D;
  }

  let isResizeScheduled = false;
  window.addEventListener('resize', () => {
    if (!isResizeScheduled) {
      isResizeScheduled = true;
      // TODO(Alexis): bindable
      setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        dpr = getDpr();
        canvasEl.style.width = `${width}px`;
        canvasEl.style.height = `${height}px`;
        if (worker) {
          worker.postMessage({
            type: 'resize',
            width,
            height,
            dpr,
          });
        } else {
          canvasEl.width = width * dpr;
          canvasEl.height = height * dpr;
          if (ctx) {
            ctx.resetTransform();
            ctx.scale(dpr, dpr);
          }
          draw();
        }
        isResizeScheduled = false;
      });
    }
  });

  let prevScrollX = window.scrollX;
  let prevScrollY = window.scrollY;
  let isScrollScheduled = false;

  window.addEventListener('scroll', () => {
    if (!isScrollScheduled) {
      isScrollScheduled = true;
      // TODO(Alexis): bindable
      setTimeout(() => {
        const { scrollX, scrollY } = window;
        const deltaX = scrollX - prevScrollX;
        const deltaY = scrollY - prevScrollY;
        prevScrollX = scrollX;
        prevScrollY = scrollY;
        if (worker) {
          worker.postMessage({
            type: 'scroll',
            deltaX,
            deltaY,
          });
        } else {
          requestAnimationFrame(
            updateScroll.bind(null, activeOutlines, deltaX, deltaY),
          );
        }
        isScrollScheduled = false;
      }, 16 * 2);
    }
  });

  setInterval(() => {
    if (blueprintMapKeys.size) {
      requestAnimationFrame(flushOutlines);
    }
  }, 16 * 2);

  shadowRoot.appendChild(canvasEl);
  return host;
};

export const hasStopped = () => {
  return globalThis.__REACT_SCAN_STOP__;
};

export const stop = () => {
  globalThis.__REACT_SCAN_STOP__ = true;
  cleanup();
};

export const cleanup = () => {
  const host = document.querySelector('[data-react-scan]');
  if (host) {
    host.remove();
  }
};

const reportRenderToListeners = (fiber: Fiber) => {
  if (isCompositeFiber(fiber)) {
    // report render has a non trivial cost because it calls Date.now(), so we want to avoid the computation if possible
    if (
      ReactScanInternals.options.value.showToolbar !== false &&
      Store.inspectState.value.kind === 'focused'
    ) {
      const reportFiber = fiber;
      const { selfTime } = getTimings(fiber);
      const displayName = getDisplayName(fiber.type);
      const fiberId = getFiberId(reportFiber);

      const currentData = Store.reportData.get(fiberId);
      const existingCount = currentData?.count ?? 0;
      const existingTime = currentData?.time ?? 0;

      const changes: Array<Change> = [];

      // optimization, for now only track changes on inspected prop, cleanup later when changes is used in outline drawing
      const listeners = Store.changesListeners.get(getFiberId(fiber));

      if (listeners?.length) {
        const propsChanges: Array<PropsChange> = getChangedPropsDetailed(
          fiber,
        ).map((change) => ({
          type: ChangeReason.Props,
          name: change.name,
          value: change.value,
          prevValue: change.prevValue,
          unstable: false,
        }));

        const stateChanges = getStateChanges(fiber);

        // context changes are incorrect, bippy needs to tell us the context dependencies that changed and provide those values every render
        // currently, we say every context change, regardless of the render it happened, is a change. Which requires us to hack change tracking
        // in the whats-changed toolbar component
        const fiberContext = getContextChanges(fiber);
        const contextChanges: Array<ContextChange> = fiberContext.map(
          (info) => ({
            name: info.name,
            type: ChangeReason.Context,
            value: info.value,
            contextType: info.contextType,
          }),
        );

        listeners.forEach((listener) => {
          listener({
            propsChanges,
            stateChanges,
            contextChanges,
          });
        });
      }
      const fiberData: OldRenderData = {
        count: existingCount + 1,
        time: existingTime + selfTime || 0,
        renders: [],
        displayName,
        type: getType(fiber.type) || null,
        changes,
      };

      Store.reportData.set(fiberId, fiberData);
      needsReport = true;
    }
  }
};

let needsReport = false;
let reportInterval: ReturnType<typeof setInterval>;
export const startReportInterval = () => {
  clearInterval(reportInterval);
  reportInterval = setInterval(() => {
    if (needsReport) {
      Store.lastReportTime.value = Date.now();
      needsReport = false;
    }
  }, 50);
};

export const isValidFiber = (fiber: Fiber) => {
  if (ignoredProps.has(fiber.memoizedProps)) {
    return false;
  }

  return true;
};
export const initReactScanInstrumentation = (setupToolbar: () => void) => {
  if (hasStopped()) return;
  // todo: don't hardcode string getting weird ref error in iife when using process.env
  let schedule: ReturnType<typeof requestAnimationFrame>;
  let mounted = false;

  const scheduleSetup = () => {
    if (mounted) {
      return;
    }
    if (schedule) {
      cancelAnimationFrame(schedule);
    }
    schedule = requestAnimationFrame(() => {
      mounted = true;
      const host = getCanvasEl();
      if (host) {
        document.documentElement.appendChild(host);
      }
      setupToolbar();
    }); // TODO(Alexis): perhaps a better timing
  };

  const instrumentation = createInstrumentation('react-scan-devtools-0.1.0', {
    onCommitStart: () => {
      ReactScanInternals.options.value.onCommitStart?.();
    },
    onActive: () => {
      if (hasStopped()) return;

      scheduleSetup();
      if (!window.__REACT_SCAN_EXTENSION__) {
        globalThis.__REACT_SCAN__ = {
          ReactScanInternals,
        };
      }
      startReportInterval();
      logIntro();
    },
    onError: () => {
      // todo: ingest errors without accidentally collecting data about user
    },
    isValidFiber,
    onRender: (fiber, renders) => {
      if (isCompositeFiber(fiber)) {
        Store.interactionListeningForRenders?.(fiber, renders);
      }
      const isOverlayPaused =
        ReactScanInternals.instrumentation?.isPaused.value;
      const isInspectorInactive =
        Store.inspectState.value.kind === 'inspect-off' ||
        Store.inspectState.value.kind === 'uninitialized';
      const shouldFullyAbort = isOverlayPaused && isInspectorInactive;

      if (shouldFullyAbort) {
        return;
      }
      if (!isOverlayPaused) {
        outlineFiber(fiber);
      }
      if (ReactScanInternals.options.value.log) {
        // this can be expensive given enough re-renders
        log(renders);
      }

      if (Store.inspectState.value.kind === 'focused') {
        inspectorUpdateSignal.value = Date.now();
      }
      if (!isInspectorInactive) {
        reportRenderToListeners(fiber);
      }

      ReactScanInternals.options.value.onRender?.(fiber, renders);
    },
    onCommitFinish: () => {
      scheduleSetup();
      ReactScanInternals.options.value.onCommitFinish?.();
    },
    onPostCommitFiberRoot() {
      scheduleSetup();
    },
    trackChanges: false,
  });
  ReactScanInternals.instrumentation = instrumentation;
};
