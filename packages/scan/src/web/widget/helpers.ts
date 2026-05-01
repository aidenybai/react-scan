import { MIN_SIZE } from '../constants';
import { getSafeArea, type SafeAreaInsets } from '../utils/safe-area';
import type { Corner, Position, ResizeHandleProps, Size } from './types';

class WindowDimensions {
  maxWidth: number;
  maxHeight: number;

  constructor(
    public width: number,
    public height: number,
    public safeArea: SafeAreaInsets,
  ) {
    this.maxWidth = width - safeArea.left - safeArea.right;
    this.maxHeight = height - safeArea.top - safeArea.bottom;
  }

  rightEdge(width: number): number {
    return this.width - width - this.safeArea.right;
  }

  bottomEdge(height: number): number {
    return this.height - height - this.safeArea.bottom;
  }

  isFullWidth(width: number): boolean {
    return width >= this.maxWidth;
  }

  isFullHeight(height: number): boolean {
    return height >= this.maxHeight;
  }
}

let cachedWindowDimensions: WindowDimensions | undefined;

const safeAreaMatches = (a: SafeAreaInsets, b: SafeAreaInsets): boolean =>
  a.top === b.top &&
  a.right === b.right &&
  a.bottom === b.bottom &&
  a.left === b.left;

export const getWindowDimensions = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const currentSafeArea = getSafeArea();

  if (
    cachedWindowDimensions &&
    cachedWindowDimensions.width === currentWidth &&
    cachedWindowDimensions.height === currentHeight &&
    safeAreaMatches(cachedWindowDimensions.safeArea, currentSafeArea)
  ) {
    return cachedWindowDimensions;
  }

  cachedWindowDimensions = new WindowDimensions(
    currentWidth,
    currentHeight,
    currentSafeArea,
  );

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
  const isRTL = getComputedStyle(document.body).direction === 'rtl';

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const safeArea = getSafeArea();

  // Check if widget is minimized
  const isMinimized = width === MIN_SIZE.width;

  // Only bound dimensions if minimized
  const effectiveWidth = isMinimized
    ? width
    : Math.min(width, windowWidth - safeArea.left - safeArea.right);
  const effectiveHeight = isMinimized
    ? height
    : Math.min(height, windowHeight - safeArea.top - safeArea.bottom);

  // Calculate base positions
  let x: number;
  let y: number;

  let leftBound = safeArea.left;
  let rightBound =  windowWidth - effectiveWidth - safeArea.right;
  let topBound = safeArea.top;
  let bottomBound = windowHeight - effectiveHeight - safeArea.bottom;

  // In RTL the toolbar's containing block resolves to the right viewport
  // edge (position: fixed with both left:0 and right:0 plus an explicit
  // width pins to inline-end). translateX(negative) moves it leftward
  // from that right anchor, so the *physical* right inset is `-safeArea.right`
  // and the physical left inset is `-(windowWidth - width - safeArea.left)`.
  // With symmetric SAFE_AREA these collapse to the original `-leftBound` /
  // `-rightBound` values; asymmetric `safeArea` would otherwise apply the
  // wrong edge to the wrong physical side.
  const rtlRightCornerX = -safeArea.right;
  const rtlLeftCornerX = -(windowWidth - effectiveWidth - safeArea.left);

  switch (corner) {
    case 'top-right':
      x = isRTL ? rtlRightCornerX : rightBound;
      y = topBound;
      break;
    case 'bottom-right':
      x = isRTL ? rtlRightCornerX : rightBound;
      y = bottomBound;
      break;
    case 'bottom-left':
      x = isRTL ? rtlLeftCornerX : leftBound;
      y = bottomBound;
      break;
    case 'top-left':
      x = isRTL ? rtlLeftCornerX : leftBound;
      y = topBound;
      break;
    default:
      x = leftBound;
      y = topBound;
      break;
  }

  // Only ensure positions are within bounds if minimized
  if (isMinimized) {
    if (isRTL) {
      x = Math.min(
        rtlRightCornerX,
        Math.max(x, rtlLeftCornerX),
      );
    } else {
      x = Math.max(
        leftBound,
        Math.min(x, rightBound),
      );
    }
    y = Math.max(
      topBound,
      Math.min(y, bottomBound),
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
  const isRTL = getComputedStyle(document.body).direction === 'rtl';
  const safeArea = getSafeArea();

  const maxWidth = window.innerWidth - safeArea.left - safeArea.right;
  const maxHeight = window.innerHeight - safeArea.top - safeArea.bottom;

  let newWidth = initialSize.width;
  let newHeight = initialSize.height;
  let newX = initialPosition.x;
  let newY = initialPosition.y;

  // horizontal resize for RTL
  if (isRTL && position.includes('right')) {
    // Check if we have enough space on the right
    const availableWidth = -initialPosition.x + initialSize.width - safeArea.right;
    const proposedWidth = Math.min(initialSize.width + deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
    newX = initialPosition.x + (newWidth - initialSize.width);
  }
  if (isRTL && position.includes('left')) {
    // Check if we have enough space on the left
    const availableWidth = window.innerWidth - initialPosition.x - safeArea.left;
    const proposedWidth = Math.min(initialSize.width - deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
  }
  // horizontal resize for LTR
  if (!isRTL && position.includes('right')) {
    // Check if we have enough space on the right
    const availableWidth = window.innerWidth - initialPosition.x - safeArea.right;
    const proposedWidth = Math.min(initialSize.width + deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
  }
  if (!isRTL && position.includes('left')) {
    // Check if we have enough space on the left
    const availableWidth = initialPosition.x + initialSize.width - safeArea.left;
    const proposedWidth = Math.min(initialSize.width - deltaX, availableWidth);
    newWidth = Math.min(maxWidth, Math.max(MIN_SIZE.width, proposedWidth));
    newX = initialPosition.x - (newWidth - initialSize.width);
  }

  // vertical resize
  if (position.includes('bottom')) {
    // Check if we have enough space at the bottom
    const availableHeight = window.innerHeight - initialPosition.y - safeArea.bottom;
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
    const availableHeight = initialPosition.y + initialSize.height - safeArea.top;
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

  let leftBound = safeArea.left;
  let rightBound = window.innerWidth - safeArea.right - newWidth;
  let topBound = safeArea.top;
  let bottomBound = window.innerHeight - safeArea.bottom - newHeight;

  // See `calculatePosition` for why RTL uses these values: the toolbar is
  // right-anchored in RTL, so physical-edge insets need different bounds
  // than the LTR `[leftBound, rightBound]` clamp.
  const rtlRightCornerX = -safeArea.right;
  const rtlLeftCornerX = -(window.innerWidth - newWidth - safeArea.left);

  // Ensure position stays within bounds
  if (isRTL) {
    newX = Math.min(
      rtlRightCornerX,
      Math.max(newX, rtlLeftCornerX),
    );
  } else {
    newX = Math.max(
      leftBound,
      Math.min(newX, rightBound),
    );
  }

  newY = Math.max(
    topBound,
    Math.min(newY, bottomBound),
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
