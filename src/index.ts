import { type Fiber, type FiberRoot } from 'react-reconciler';
import { type ComponentType } from 'react';
import {
  createFullscreenCanvas,
  createStatus,
  flushOutlines,
  getOutline,
  getPendingOutlines,
  setPendingOutlines,
} from './overlay';
import { MONO_FONT } from './constants';
import {
  traverseFiberUntil,
  registerDevtoolsHook,
  getType,
  traverseFiber,
} from './fiber';
import type { Outline, ScanOptions, WithScanOptions } from './types';
import { isInIframe, isProd } from './utils';

const DEFAULT_OPTIONS: ScanOptions & WithScanOptions = {
  enabled: true,
  includeChildren: true,
  log: false,
  clearLog: false,
  production: false,
};
let currentOptions: ScanOptions & WithScanOptions = DEFAULT_OPTIONS;
export const getCurrentOptions = () => currentOptions;
let allowList: Map<ComponentType<any>, WithScanOptions> | null = null;

let inited = false;

export const withScan = <T>(
  component: ComponentType<T>,
  options: ScanOptions & WithScanOptions = DEFAULT_OPTIONS,
) => {
  options.log ??= true;
  scan(options);
  if (!allowList) allowList = new Map();
  allowList.set(getType(component), options);
  return component;
};

let onCommitFiberRoot = (_rendererID: number, _root: FiberRoot): void => {
  /**/
};

if (typeof window !== 'undefined') {
  registerDevtoolsHook({
    onCommitFiberRoot: (rendererID, root) => {
      onCommitFiberRoot(rendererID, root);
    },
  });
}

export const scan = (
  options: ScanOptions & WithScanOptions = DEFAULT_OPTIONS,
) => {
  currentOptions = options ?? currentOptions;

  if (!currentOptions.production && isProd()) {
    return;
  }
  if (inited || isInIframe() || currentOptions.enabled === false) {
    return;
  }
  inited = true;

  // eslint-disable-next-line no-console
  console.log(
    '%cTry Million Lint to automatically optimize your app: https://million.dev',
    `font-weight:bold;font-size:14px;font-weight:bold;font-family:${MONO_FONT}`,
  );

  const canvasInstance = createFullscreenCanvas();
  const status = createStatus();

  const handleCommitFiberRoot = (_rendererID: number, root: FiberRoot) => {
    const outlines: Outline[] = [];
    let totalSelfTime = 0;
    let totalCount = 0;

    const handleFiber = (fiber: Fiber) => {
      const outline = getOutline(fiber);
      if (!outline) return null;

      const shouldScan =
        allowList?.has(fiber.type) ?? allowList?.has(fiber.elementType);

      if (allowList) {
        const parent = traverseFiberUntil(
          fiber,
          (node) => {
            const options =
              allowList?.get(node.type) ?? allowList?.get(node.elementType);
            return options?.includeChildren;
          },
          true,
        );
        if (!parent && !shouldScan) return null;
      }
      outlines.push(outline);
      return outline;
    };

    // if (root.memoizedUpdaters) {
    //   for (const updaterFiber of root.memoizedUpdaters) {
    //     const outline = handleFiber(updaterFiber);
    //     if (outline) {
    //       outline.trigger = true;
    //       // traverseFiber(updaterFiber, (fiber) => {
    //       //   handleFiber(fiber);
    //       // });
    //     }
    //   }
    // }

    traverseFiber(root.current, (fiber) => {
      handleFiber(fiber);
    });

    const nextPendingOutlines = setPendingOutlines([
      ...getPendingOutlines(),
      ...outlines,
    ]);

    if (nextPendingOutlines.length && canvasInstance.ctx) {
      for (let i = 0, len = nextPendingOutlines.length; i < len; i++) {
        const outline = nextPendingOutlines[i];
        totalSelfTime += outline.selfTime;
        totalCount += outline.count;
      }
      let text = `×${totalCount}`;
      if (totalSelfTime > 0) text += ` (${totalSelfTime.toFixed(2)}ms)`;
      status.textContent = `${text} · react-scan`;
      flushOutlines(canvasInstance.ctx);
    }
  };

  onCommitFiberRoot = (_rendererID: number, root: FiberRoot) => {
    try {
      handleCommitFiberRoot(_rendererID, root);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };
  registerDevtoolsHook({
    onCommitFiberRoot,
  });
};
