import { SAFE_AREA, MIN_SIZE } from '../../constants';
import { type Corner, type Position, type ResizeHandleProps, type Size } from './types';

export const getWindowDimensions = (() => {
  let cache: {
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
    rightEdge: (width: number) => number;
    bottomEdge: (height: number) => number;
    isFullWidth: (width: number) => boolean;
    isFullHeight: (height: number) => boolean;
  } | null = null;

  return () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    if (cache && cache.width === currentWidth && cache.height === currentHeight) {
      return {
        maxWidth: cache.maxWidth,
        maxHeight: cache.maxHeight,
        rightEdge: cache.rightEdge,
        bottomEdge: cache.bottomEdge,
        isFullWidth: cache.isFullWidth,
        isFullHeight: cache.isFullHeight
      };
    }

    const maxWidth = currentWidth - (SAFE_AREA * 2);
    const maxHeight = currentHeight - (SAFE_AREA * 2);

    cache = {
      width: currentWidth,
      height: currentHeight,
      maxWidth,
      maxHeight,
      rightEdge: (width: number) => currentWidth - width - SAFE_AREA,
      bottomEdge: (height: number) => currentHeight - height - SAFE_AREA,
      isFullWidth: (width: number) => width >= maxWidth,
      isFullHeight: (height: number) => height >= maxHeight
    };

    return {
      maxWidth: cache.maxWidth,
      maxHeight: cache.maxHeight,
      rightEdge: cache.rightEdge,
      bottomEdge: cache.bottomEdge,
      isFullWidth: cache.isFullWidth,
      isFullHeight: cache.isFullHeight
    };
  };
})();

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
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Calculate base positions
  switch (corner) {
    case 'top-right':
      return {
        x: windowWidth - width - SAFE_AREA,
        y: SAFE_AREA
      };
    case 'bottom-right':
      return {
        x: windowWidth - width - SAFE_AREA,
        y: windowHeight - height - SAFE_AREA
      };
    case 'bottom-left':
      return {
        x: SAFE_AREA,
        y: windowHeight - height - SAFE_AREA
      };
    case 'top-left':
    default:
      return {
        x: SAFE_AREA,
        y: SAFE_AREA
      };
  }
};

export const getPositionClasses = (position: ResizeHandleProps['position']): string => {
  switch (position) {
    case 'top': return 'top-0 left-0 right-0 -translate-y-3/4';
    case 'bottom': return 'right-0 bottom-0 left-0 translate-y-3/4';
    case 'left': return 'top-0 bottom-0 left-0 -translate-x-3/4';
    case 'right': return 'top-0 right-0 bottom-0 translate-x-3/4';
    case 'top-left': return 'top-0 left-0 -translate-x-3/4 -translate-y-3/4';
    case 'top-right': return 'top-0 right-0 translate-x-3/4 -translate-y-3/4';
    case 'bottom-left': return 'bottom-0 left-0 -translate-x-3/4 translate-y-3/4';
    case 'bottom-right': return 'bottom-0 right-0 translate-x-3/4 translate-y-3/4';
    default: return '';
  }
};

export const getInteractionClasses = (
  position: ResizeHandleProps['position'],
  isLine: boolean,
): Array<string> => {
  // Common classes for both line and corner handles
  const commonClasses = [
    'transition-[transform,opacity]',
    'duration-300',
    'delay-500',
    'group-hover:delay-0',
    'group-active:delay-0',
  ];

  // Line handles
  if (isLine) {
    return [
      ...commonClasses,
      // Size classes
      position === 'left' || position === 'right' ? 'w-6' : 'w-full',
      position === 'left' || position === 'right' ? 'h-full' : 'h-6',
      // Cursor classes
      position === 'left' || position === 'right' ? 'cursor-ew-resize' : 'cursor-ns-resize'
    ];
  }

  // Corner handles only
  return [
    ...commonClasses,
    'w-6',
    'h-6',
    position === 'top-left' || position === 'bottom-right' ? 'cursor-nwse-resize' : 'cursor-nesw-resize',
    `rounded-${position.split('-').join('')}`
  ];
};

const positionMatchesCorner = (position: ResizeHandleProps['position'], corner: Corner): boolean => {
  const [vertical, horizontal] = corner.split('-');
  return position !== vertical && position !== horizontal;
};

export const getHandleVisibility = (
  position: ResizeHandleProps['position'],
  isLine: boolean,
  corner: Corner,
  isFullWidth: boolean,
  isFullHeight: boolean
): boolean => {
  if (isFullWidth && isFullHeight) {
    return true;
  }

  // Normal state
  if (!isFullWidth && !isFullHeight) {
    if (isLine) {
      return positionMatchesCorner(position, corner);
    }
    return position === getOppositeCorner(corner, corner, true);
  }

  // Full width state
  if (isFullWidth) {
    if (isLine) {
      return position !== corner.split('-')[0];
    }
    return !position.startsWith(corner.split('-')[0]);
  }

  // Full height state
  if (isFullHeight) {
    if (isLine) {
      return position !== corner.split('-')[1];
    }
    return !position.endsWith(corner.split('-')[1]);
  }

  return false;
};


export const calculateBoundedSize = (
  currentSize: number,
  delta: number,
  isWidth: boolean
): number => {
  const min = isWidth ? MIN_SIZE.width : MIN_SIZE.height * 5;
  const max = isWidth
    ? getWindowDimensions().maxWidth
    : getWindowDimensions().maxHeight;

  const newSize = currentSize + delta;
  return Math.min(Math.max(min, newSize), max);
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
    // Check if we have enough space on the right
    const availableWidth = window.innerWidth - initialPosition.x - SAFE_AREA;
    const proposedWidth = Math.min(initialSize.width + deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
  }
  if (position.includes('left')) {
    // Check if we have enough space on the left
    const availableWidth = initialPosition.x + initialSize.width - SAFE_AREA;
    const proposedWidth = Math.min(initialSize.width - deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
    newX = initialPosition.x - (newWidth - initialSize.width);
  }

  // vertical resize
  if (position.includes('bottom')) {
    // Check if we have enough space at the bottom
    const availableHeight = window.innerHeight - initialPosition.y - SAFE_AREA;
    const proposedHeight = Math.min(initialSize.height + deltaY, availableHeight);
    newHeight = Math.min(maxHeight, Math.max(MIN_SIZE.height * 5, proposedHeight));
  }
  if (position.includes('top')) {
    // Check if we have enough space at the top
    const availableHeight = initialPosition.y + initialSize.height - SAFE_AREA;
    const proposedHeight = Math.min(initialSize.height - deltaY, availableHeight);
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

// Helper to determine best corner based on cursor position, widget size, and movement
export const getBestCorner = (
  mouseX: number,
  mouseY: number,
  initialMouseX?: number,
  initialMouseY?: number,
  threshold = 100
): Corner => {
  const deltaX = initialMouseX !== undefined ? mouseX - initialMouseX : 0;
  const deltaY = initialMouseY !== undefined ? mouseY - initialMouseY : 0;

  const windowCenterX = window.innerWidth / 2;
  const windowCenterY = window.innerHeight / 2;

  // Determine movement direction
  const movingRight = deltaX > threshold;
  const movingLeft = deltaX < -threshold;
  const movingDown = deltaY > threshold;
  const movingUp = deltaY < -threshold;

  // If horizontal movement
  if (movingRight || movingLeft) {
    const isBottom = mouseY > windowCenterY;
    return movingRight
      ? (isBottom ? 'bottom-right' : 'top-right')
      : (isBottom ? 'bottom-left' : 'top-left');
  }

  // If vertical movement
  if (movingDown || movingUp) {
    const isRight = mouseX > windowCenterX;
    return movingDown
      ? (isRight ? 'bottom-right' : 'bottom-left')
      : (isRight ? 'top-right' : 'top-left');
  }

  // If no significant movement, use quadrant-based position
  return mouseX > windowCenterX
    ? (mouseY > windowCenterY ? 'bottom-right' : 'top-right')
    : (mouseY > windowCenterY ? 'bottom-left' : 'top-left');
};
