import { SAFE_AREA, MIN_SIZE } from '../../constants';
import { type Corner, type Position, type ResizeHandleProps, type Size } from './types';

interface WindowDimensionsCache {
  width: number;
  height: number;
  dimensions: {
    maxWidth: number;
    maxHeight: number;
    rightEdge: (width: number) => number;
    bottomEdge: (height: number) => number;
    isFullWidth: (width: number) => boolean;
    isFullHeight: (height: number) => boolean;
  } | null;
}

const windowDimensionsCache: WindowDimensionsCache = {
  width: 0,
  height: 0,
  dimensions: null
};

export const getWindowDimensions = () => {
  const maxWidth = window.innerWidth - (SAFE_AREA * 2);
  const maxHeight = window.innerHeight - (SAFE_AREA * 2);

  if (
    windowDimensionsCache.width === window.innerWidth &&
    windowDimensionsCache.height === window.innerHeight &&
    windowDimensionsCache.dimensions
  ) {
    return windowDimensionsCache.dimensions;
  }

  const dimensions = {
    maxWidth,
    maxHeight,
    rightEdge: (width: number) => window.innerWidth - width - SAFE_AREA,
    bottomEdge: (height: number) => window.innerHeight - height - SAFE_AREA,
    isFullWidth: (width: number) => width >= maxWidth,
    isFullHeight: (height: number) => height >= maxHeight
  };

  windowDimensionsCache.width = window.innerWidth;
  windowDimensionsCache.height = window.innerHeight;
  windowDimensionsCache.dimensions = dimensions;

  return dimensions;
};

export const getOppositeCorner = (
  position: ResizeHandleProps['position'],
  currentCorner: Corner,
  isFullScreen: boolean,
  isFullWidth?: boolean,
  isFullHeight?: boolean
): Corner => {
  // For full screen mode
  if (isFullScreen) {
    if (position === 'top-left') return 'bottom-right';
    if (position === 'top-right') return 'bottom-left';
    if (position === 'bottom-left') return 'top-right';
    if (position === 'bottom-right') return 'top-left';

    const [vertical, horizontal] = currentCorner.split('-');
    if (position === 'left') return `${vertical}-right` as Corner;
    if (position === 'right') return `${vertical}-left` as Corner;
    if (position === 'top') return `bottom-${horizontal}` as Corner;
    if (position === 'bottom') return `top-${horizontal}` as Corner;
  }

  // For full width mode
  if (isFullWidth) {
    if (position === 'left') return `${currentCorner.split('-')[0]}-right` as Corner;
    if (position === 'right') return `${currentCorner.split('-')[0]}-left` as Corner;
  }

  // For full height mode
  if (isFullHeight) {
    if (position === 'top') return `bottom-${currentCorner.split('-')[1]}` as Corner;
    if (position === 'bottom') return `top-${currentCorner.split('-')[1]}` as Corner;
  }

  return currentCorner;
};

export const calculatePosition = (corner: Corner, width: number, height: number): Position => {
  const { rightEdge, bottomEdge } = getWindowDimensions();

  switch (corner) {
    case 'top-right':
      return { x: rightEdge(width), y: SAFE_AREA };
    case 'bottom-right':
      return { x: rightEdge(width), y: bottomEdge(height) };
    case 'bottom-left':
      return { x: SAFE_AREA, y: bottomEdge(height) };
    case 'top-left':
    default:
      return { x: SAFE_AREA, y: SAFE_AREA };
  }
};

export const getPositionClasses = (position: ResizeHandleProps['position']) => {
  return {
    'top-0 left-0 w-full -translate-y-1/2': position === 'top',
    'bottom-0 left-0 w-full translate-y-1/2': position === 'bottom',
    'left-0 top-0 h-full -translate-x-1/2': position === 'left',
    'right-0 top-0 h-full translate-x-1/2': position === 'right',

    'top-0 left-0 -translate-x-1/2 -translate-y-1/2': position === 'top-left',
    'top-0 right-0 translate-x-1/2 -translate-y-1/2': position === 'top-right',
    'bottom-0 left-0 -translate-x-1/2 translate-y-1/2': position === 'bottom-left',
    'bottom-0 right-0 translate-x-1/2 translate-y-1/2': position === 'bottom-right',
  };
};

export const getInteractionClasses = (
  position: ResizeHandleProps['position'],
  isLine: boolean,
  isDiabled: boolean
) => {
  return {
    'hover:opacity-100': !isDiabled,
    'pointer-events-none': isDiabled,
    'w-6 h-6': !isLine,
    'w-5 h-full': isLine && (position === 'left' || position === 'right'),
    'w-full h-5': isLine && (position === 'top' || position === 'bottom'),
    'rounded-tl': !isLine && position === 'top-left',
    'rounded-tr': !isLine && position === 'top-right',
    'rounded-bl': !isLine && position === 'bottom-left',
    'rounded-br': !isLine && position === 'bottom-right',
    'cursor-ew-resize': isLine && (position === 'left' || position === 'right'),
    'cursor-ns-resize': isLine && (position === 'top' || position === 'bottom'),
  };
};

const positionMatchesCorner = (position: ResizeHandleProps['position'], corner: Corner): boolean => {
  if (position === corner) return true;

  const [vertical, horizontal] = corner.split('-');
  return position === vertical || position === horizontal;
};

export const getHandleVisibility = (
  position: ResizeHandleProps['position'],
  isLine: boolean,
  corner: Corner,
  isFullWidth: boolean,
  isFullHeight: boolean
): boolean => {
  if (isFullWidth && isFullHeight) {
    return false;
  }

  // Normal state
  if (!isFullWidth && !isFullHeight) {
    return isLine
      ? positionMatchesCorner(position, corner)
      : position === corner ||
      (corner.includes(position.split('-')[0]) || corner.includes(position.split('-')[1]));
  }

  // Full width state
  if (isFullWidth) {
    return isLine
      ? position === 'top' && corner.startsWith('top') ||
      position === 'bottom' && corner.startsWith('bottom')
      : corner.startsWith(position.split('-')[0]);
  }

  // Full height state
  return isLine
    ? position === 'left' && corner.endsWith('left') ||
    position === 'right' && corner.endsWith('right')
    : corner.endsWith(position.split('-')[1]);
};


export const calculateBoundedSize = (
  currentSize: number,
  delta: number,
  isWidth: boolean
): number => {
  const min = isWidth ? MIN_SIZE.width : MIN_SIZE.height;
  const max = isWidth ? getWindowDimensions().maxWidth : getWindowDimensions().maxHeight;

  return Math.min(Math.max(min, currentSize + delta), max);
}

export const calculateNewSizeAndPosition = (
  position: ResizeHandleProps['position'],
  initialSize: Size,
  initialPosition: Position,
  deltaX: number,
  deltaY: number
): { newSize: Size; newPosition: Position } => {
  const maxWidth = window.innerWidth - (SAFE_AREA * 2);
  const maxHeight = window.innerHeight - (SAFE_AREA * 2);

  let newWidth = initialSize.width;
  let newHeight = initialSize.height;
  let newX = initialPosition.x;
  let newY = initialPosition.y;

  // horizontal resize
  if (position.includes('right')) {
    const proposedWidth = initialSize.width + deltaX;
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
  }
  if (position.includes('left')) {
    const proposedWidth = initialSize.width - deltaX;
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
    newX = initialPosition.x - (newWidth - initialSize.width);
  }

  // vertical resize
  if (position.includes('bottom')) {
    const proposedHeight = initialSize.height + deltaY;
    newHeight = Math.min(maxHeight, Math.max(MIN_SIZE.height * 5, proposedHeight));
  }
  if (position.includes('top')) {
    const proposedHeight = initialSize.height - deltaY;
    newHeight = Math.min(maxHeight, Math.max(MIN_SIZE.height * 5, proposedHeight));
    newY = initialPosition.y - (newHeight - initialSize.height);
  }

  // Ensure position stays within bounds
  newX = Math.max(SAFE_AREA, Math.min(newX, window.innerWidth - SAFE_AREA - newWidth));
  newY = Math.max(SAFE_AREA, Math.min(newY, window.innerHeight - SAFE_AREA - newHeight));

  return {
    newSize: { width: newWidth, height: newHeight },
    newPosition: { x: newX, y: newY }
  };
};

export const getClosestCorner = (position: Position): Corner => {
  const { maxWidth, maxHeight } = getWindowDimensions();

  const distances = {
    'top-left': Math.hypot(position.x, position.y),
    'top-right': Math.hypot(maxWidth - position.x, position.y),
    'bottom-left': Math.hypot(position.x, maxHeight - position.y),
    'bottom-right': Math.hypot(maxWidth - position.x, maxHeight - position.y)
  };

  return Object.entries(distances).reduce<Corner>((closest, [corner, distance]) => {
    return distance < distances[closest] ? corner as Corner : closest;
  }, 'top-left');
};
