import type { Fiber } from 'bippy';
import { Store } from '~core/index';
import { findComponentDOMNode } from '~web/views/inspector/utils';
import { readLocalStorage } from './helpers';

export interface FiberMetadata {
  componentName: string;
  parent: string;
  position: number;
  sibling: string | null;
  path: string;
  propKeys: string[];
}

const metadata = readLocalStorage<FiberMetadata>('react-scann-pinned');

export const getFiberPath = (fiber: Fiber): string => {
  const pathSegments: string[] = [];
  let currentFiber: Fiber | null = fiber;

  while (currentFiber) {
    const elementType = currentFiber.elementType;
    const name =
      typeof elementType === 'function'
        ? elementType.displayName || elementType.name
        : typeof elementType === 'string'
          ? elementType
          : 'Unknown';

    const index =
      currentFiber.index !== undefined ? `[${currentFiber.index}]` : '';
    pathSegments.unshift(`${name}${index}`);

    currentFiber = currentFiber.return ?? null;
  }

  return pathSegments.join('::');
};

export const getFiberMetadata = (fiber: Fiber): FiberMetadata | null => {
  if (!fiber || !fiber.elementType) return null;

  const componentName = fiber.elementType.name || 'UnknownComponent';
  const position = fiber.index !== undefined ? fiber.index : -1;
  const sibling = fiber.sibling?.elementType?.name || null;

  let parentFiber = fiber.return;
  let parent = 'Root';

  while (parentFiber) {
    const parentName = parentFiber.elementType?.name;

    if (typeof parentName === 'string' && parentName.trim().length > 0) {
      parent = parentName;
      break;
    }

    parentFiber = parentFiber.return;
  }

  const path = getFiberPath(fiber);

  const propKeys = fiber.pendingProps
    ? Object.keys(fiber.pendingProps).filter((key) => key !== 'children')
    : [];

  return { componentName, parent, position, sibling, path, propKeys };
};

const checkFiberMatch = (fiber: Fiber | undefined): boolean => {
  if (!fiber || !fiber.elementType || !metadata?.componentName) return false;

  if (fiber.elementType.name !== metadata.componentName) return false;

  let currentParentFiber = fiber.return;
  let parent = '';

  while (currentParentFiber) {
    if (currentParentFiber.elementType?.name) {
      parent = currentParentFiber.elementType.name;
      break;
    }
    currentParentFiber = currentParentFiber.return;
  }

  if (parent !== metadata.parent) return false;
  if (fiber.index !== metadata.position) return false;

  const fiberPath = getFiberPath(fiber);
  return fiberPath === metadata.path;
};

const fiberQueue: Fiber[] = [];
let isProcessing = false;

const processFiberQueue = (): void => {
  if (isProcessing || fiberQueue.length === 0) return;
  isProcessing = true;

  requestIdleCallback(() => {
    while (fiberQueue.length > 0) {
      const fiber = fiberQueue.shift();
      if (fiber && checkFiberMatch(fiber)) {
        // biome-ignore lint/suspicious/noConsole: Intended debug output
        console.log('🎯 Pinned component found!', fiber);
        isProcessing = false;

        const componentElement = findComponentDOMNode(fiber);

        if (!componentElement) return;

        Store.inspectState.value = {
          kind: 'focused',
          focusedDomElement: componentElement,
          fiber,
        };
        return;
      }
    }
    isProcessing = false;
  });
};

export const enqueueFiber = (fiber: Fiber) => {
  if (metadata === null || metadata.componentName !== fiber.elementType?.name) {
    return;
  }

  fiberQueue.push(fiber);
  if (!isProcessing) processFiberQueue();
};
