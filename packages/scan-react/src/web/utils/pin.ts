import type { Fiber } from 'bippy';

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
