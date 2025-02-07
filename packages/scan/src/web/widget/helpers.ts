import { MIN_SIZE, SAFE_AREA } from '../constants';
import type { Corner, Position, ResizeHandleProps, Size } from './types';

class WindowDimensions {
  maxWidth: number;
  maxHeight: number;

  constructor(
    public width: number,
    public height: number,
  ) {
    this.maxWidth = width - SAFE_AREA * 2;
    this.maxHeight = height - SAFE_AREA * 2;
  }

  rightEdge(width: number): number {
    return this.width - width - SAFE_AREA;
  }

  bottomEdge(height: number): number {
    return this.height - height - SAFE_AREA;
  }

  isFullWidth(width: number): boolean {
    return width >= this.maxWidth;
  }

  isFullHeight(height: number): boolean {
    return height >= this.maxHeight;
  }
}

let cachedWindowDimensions: WindowDimensions | undefined;

export const getWindowDimensions = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;

  if (
    cachedWindowDimensions &&
    cachedWindowDimensions.width === currentWidth &&
    cachedWindowDimensions.height === currentHeight
  ) {
    return cachedWindowDimensions;
  }

  cachedWindowDimensions = new WindowDimensions(currentWidth, currentHeight);

  return cachedWindowDimensions;
};

export const getOppositeCorner = (
  position: ResizeHandleProps['position'],
  currentCorner: Corner,
  isFullScreen: boolean,
  isFullWidth?: boolean,
  isFullHeight?: boolean,
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
    if (position === 'left')
      return `${currentCorner.split('-')[0]}-right` as Corner;
    if (position === 'right')
      return `${currentCorner.split('-')[0]}-left` as Corner;
  }

  // For full height mode
  if (isFullHeight) {
    if (position === 'top')
      return `bottom-${currentCorner.split('-')[1]}` as Corner;
    if (position === 'bottom')
      return `top-${currentCorner.split('-')[1]}` as Corner;
  }

  return currentCorner;
};

export const calculatePosition = (
  corner: Corner,
  width: number,
  height: number,
): Position => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Check if widget is minimized
  const isMinimized = width === MIN_SIZE.width;

  // Only bound dimensions if minimized
  const effectiveWidth = isMinimized
    ? width
    : Math.min(width, windowWidth - SAFE_AREA * 2);
  const effectiveHeight = isMinimized
    ? height
    : Math.min(height, windowHeight - SAFE_AREA * 2);

  // Calculate base positions
  let x: number;
  let y: number;

  switch (corner) {
    case 'top-right':
      x = windowWidth - effectiveWidth - SAFE_AREA;
      y = SAFE_AREA;
      break;
    case 'bottom-right':
      x = windowWidth - effectiveWidth - SAFE_AREA;
      y = windowHeight - effectiveHeight - SAFE_AREA;
      break;
    case 'bottom-left':
      x = SAFE_AREA;
      y = windowHeight - effectiveHeight - SAFE_AREA;
      break;
    case 'top-left':
      x = SAFE_AREA;
      y = SAFE_AREA;
      break;
    default:
      x = SAFE_AREA;
      y = SAFE_AREA;
      break;
  }

  // Only ensure positions are within bounds if minimized
  if (isMinimized) {
    x = Math.max(
      SAFE_AREA,
      Math.min(x, windowWidth - effectiveWidth - SAFE_AREA),
    );
    y = Math.max(
      SAFE_AREA,
      Math.min(y, windowHeight - effectiveHeight - SAFE_AREA),
    );
  }

  return { x, y };
};

const positionMatchesCorner = (
  position: ResizeHandleProps['position'],
  corner: Corner,
): boolean => {
  const [vertical, horizontal] = corner.split('-');
  return position !== vertical && position !== horizontal;
};

export const getHandleVisibility = (
  position: ResizeHandleProps['position'],
  corner: Corner,
  isFullWidth: boolean,
  isFullHeight: boolean,
): boolean => {
  if (isFullWidth && isFullHeight) {
    return true;
  }

  // Normal state
  if (!isFullWidth && !isFullHeight) {
    return positionMatchesCorner(position, corner);
  }

  // Full width state
  if (isFullWidth) {
    return position !== corner.split('-')[0];
  }

  // Full height state
  if (isFullHeight) {
    return position !== corner.split('-')[1];
  }

  return false;
};

export const calculateBoundedSize = (
  currentSize: number,
  delta: number,
  isWidth: boolean,
): number => {
  const min = isWidth ? MIN_SIZE.width : MIN_SIZE.initialHeight;
  const max = isWidth
    ? getWindowDimensions().maxWidth
    : getWindowDimensions().maxHeight;

  const newSize = currentSize + delta;
  return Math.min(Math.max(min, newSize), max);
};

export const calculateNewSizeAndPosition = (
  position: ResizeHandleProps['position'],
  initialSize: Size,
  initialPosition: Position,
  deltaX: number,
  deltaY: number,
): { newSize: Size; newPosition: Position } => {
  const maxWidth = window.innerWidth - SAFE_AREA * 2;
  const maxHeight = window.innerHeight - SAFE_AREA * 2;

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
    const proposedHeight = Math.min(
      initialSize.height + deltaY,
      availableHeight,
    );
    newHeight = Math.min(
      maxHeight,
      Math.max(MIN_SIZE.initialHeight, proposedHeight),
    );
  }
  if (position.includes('top')) {
    // Check if we have enough space at the top
    const availableHeight = initialPosition.y + initialSize.height - SAFE_AREA;
    const proposedHeight = Math.min(
      initialSize.height - deltaY,
      availableHeight,
    );
    newHeight = Math.min(
      maxHeight,
      Math.max(MIN_SIZE.initialHeight, proposedHeight),
    );
    newY = initialPosition.y - (newHeight - initialSize.height);
  }

  // Ensure position stays within bounds
  newX = Math.max(
    SAFE_AREA,
    Math.min(newX, window.innerWidth - SAFE_AREA - newWidth),
  );
  newY = Math.max(
    SAFE_AREA,
    Math.min(newY, window.innerHeight - SAFE_AREA - newHeight),
  );

  return {
    newSize: { width: newWidth, height: newHeight },
    newPosition: { x: newX, y: newY },
  };
};

export const getClosestCorner = (position: Position): Corner => {
  const windowDims = getWindowDimensions();

  const distances: Record<Corner, number> = {
    'top-left': Math.hypot(position.x, position.y),
    'top-right': Math.hypot(windowDims.maxWidth - position.x, position.y),
    'bottom-left': Math.hypot(position.x, windowDims.maxHeight - position.y),
    'bottom-right': Math.hypot(
      windowDims.maxWidth - position.x,
      windowDims.maxHeight - position.y,
    ),
  };

  let closest: Corner = 'top-left';

  for (const key in distances) {
    if (distances[key as Corner] < distances[closest]) {
      closest = key as Corner;
    }
  }

  return closest;
};

// Helper to determine best corner based on cursor position, widget size, and movement
export const getBestCorner = (
  mouseX: number,
  mouseY: number,
  initialMouseX?: number,
  initialMouseY?: number,
  threshold = 100,
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
      ? isBottom
        ? 'bottom-right'
        : 'top-right'
      : isBottom
        ? 'bottom-left'
        : 'top-left';
  }

  // If vertical movement
  if (movingDown || movingUp) {
    const isRight = mouseX > windowCenterX;
    return movingDown
      ? isRight
        ? 'bottom-right'
        : 'bottom-left'
      : isRight
        ? 'top-right'
        : 'top-left';
  }

  // If no significant movement, use quadrant-based position
  return mouseX > windowCenterX
    ? mouseY > windowCenterY
      ? 'bottom-right'
      : 'top-right'
    : mouseY > windowCenterY
      ? 'bottom-left'
      : 'top-left';
};
