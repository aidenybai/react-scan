import {
  TOOLBAR_COLLAPSED_LONG_PX,
  TOOLBAR_COLLAPSED_SHORT_PX,
  TOOLBAR_DEFAULT_POSITION_RATIO,
  TOOLBAR_SNAP_MARGIN_PX,
  TOOLBAR_VELOCITY_MULTIPLIER_MS,
} from "../constants";
import type { Position, SnapEdge } from "../widget/types";
import { clampToRange } from "./clamp-to-range";
import { getVisualViewport } from "./get-visual-viewport";
import { getSafeArea } from "./safe-area";

interface Dimensions {
  width: number;
  height: number;
}

interface SnapResult extends Position {
  edge: SnapEdge;
}

interface ViewportBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

export const isHorizontalEdge = (edge: SnapEdge): boolean => edge === "top" || edge === "bottom";

export const getCollapsedDimensions = (edge: SnapEdge): Dimensions => {
  const isHorizontal = isHorizontalEdge(edge);
  return {
    width: isHorizontal ? TOOLBAR_COLLAPSED_LONG_PX : TOOLBAR_COLLAPSED_SHORT_PX,
    height: isHorizontal ? TOOLBAR_COLLAPSED_SHORT_PX : TOOLBAR_COLLAPSED_LONG_PX,
  };
};

const getViewportBounds = (elementWidth: number, elementHeight: number): ViewportBounds => {
  const viewport = getVisualViewport();
  const safeArea = getSafeArea();
  const leftInset = Math.max(TOOLBAR_SNAP_MARGIN_PX, safeArea.left);
  const rightInset = Math.max(TOOLBAR_SNAP_MARGIN_PX, safeArea.right);
  const topInset = Math.max(TOOLBAR_SNAP_MARGIN_PX, safeArea.top);
  const bottomInset = Math.max(TOOLBAR_SNAP_MARGIN_PX, safeArea.bottom);
  const minimumX = viewport.offsetLeft + leftInset;
  const minimumY = viewport.offsetTop + topInset;

  return {
    minimumX,
    maximumX: Math.max(minimumX, viewport.offsetLeft + viewport.width - elementWidth - rightInset),
    minimumY,
    maximumY: Math.max(
      minimumY,
      viewport.offsetTop + viewport.height - elementHeight - bottomInset,
    ),
  };
};

export const getPositionFromEdgeAndRatio = (
  edge: SnapEdge,
  ratio: number,
  elementWidth: number,
  elementHeight: number,
): Position => {
  const bounds = getViewportBounds(elementWidth, elementHeight);
  if (isHorizontalEdge(edge)) {
    return {
      x: bounds.minimumX + (bounds.maximumX - bounds.minimumX) * clampToRange(ratio, 0, 1),
      y: edge === "top" ? bounds.minimumY : bounds.maximumY,
    };
  }

  return {
    x: edge === "left" ? bounds.minimumX : bounds.maximumX,
    y: bounds.minimumY + (bounds.maximumY - bounds.minimumY) * clampToRange(ratio, 0, 1),
  };
};

export const getRatioFromPosition = (
  edge: SnapEdge,
  positionX: number,
  positionY: number,
  elementWidth: number,
  elementHeight: number,
): number => {
  const bounds = getViewportBounds(elementWidth, elementHeight);
  if (isHorizontalEdge(edge)) {
    const availableWidth = bounds.maximumX - bounds.minimumX;
    if (availableWidth <= 0) return TOOLBAR_DEFAULT_POSITION_RATIO;
    return clampToRange((positionX - bounds.minimumX) / availableWidth, 0, 1);
  }

  const availableHeight = bounds.maximumY - bounds.minimumY;
  if (availableHeight <= 0) return TOOLBAR_DEFAULT_POSITION_RATIO;
  return clampToRange((positionY - bounds.minimumY) / availableHeight, 0, 1);
};

export const getCollapsedPosition = (
  edge: SnapEdge,
  expandedPosition: Position,
  expandedDimensions: Dimensions,
  collapsedDimensions: Dimensions,
): Position => {
  const viewport = getVisualViewport();
  if (isHorizontalEdge(edge)) {
    return {
      x: clampToRange(
        expandedPosition.x + (expandedDimensions.width - collapsedDimensions.width) / 2,
        viewport.offsetLeft,
        viewport.offsetLeft + viewport.width - collapsedDimensions.width,
      ),
      y:
        edge === "top"
          ? viewport.offsetTop
          : viewport.offsetTop + viewport.height - collapsedDimensions.height,
    };
  }

  return {
    x:
      edge === "left"
        ? viewport.offsetLeft
        : viewport.offsetLeft + viewport.width - collapsedDimensions.width,
    y: clampToRange(
      expandedPosition.y + (expandedDimensions.height - collapsedDimensions.height) / 2,
      viewport.offsetTop,
      viewport.offsetTop + viewport.height - collapsedDimensions.height,
    ),
  };
};

export const getSnapPosition = (
  currentX: number,
  currentY: number,
  elementWidth: number,
  elementHeight: number,
  velocityX: number,
  velocityY: number,
): SnapResult => {
  const viewport = getVisualViewport();
  const projectedX = currentX + velocityX * TOOLBAR_VELOCITY_MULTIPLIER_MS;
  const projectedY = currentY + velocityY * TOOLBAR_VELOCITY_MULTIPLIER_MS;
  const centerX = projectedX + elementWidth / 2;
  const centerY = projectedY + elementHeight / 2;
  const distanceToTop = centerY - viewport.offsetTop;
  const distanceToBottom = viewport.offsetTop + viewport.height - centerY;
  const distanceToLeft = centerX - viewport.offsetLeft;
  const distanceToRight = viewport.offsetLeft + viewport.width - centerX;
  const minimumDistance = Math.min(
    distanceToTop,
    distanceToBottom,
    distanceToLeft,
    distanceToRight,
  );
  let edge: SnapEdge = "bottom";
  if (minimumDistance === distanceToTop) edge = "top";
  else if (minimumDistance === distanceToLeft) edge = "left";
  else if (minimumDistance === distanceToRight) edge = "right";
  const bounds = getViewportBounds(elementWidth, elementHeight);

  return {
    edge,
    x:
      edge === "left"
        ? bounds.minimumX
        : edge === "right"
          ? bounds.maximumX
          : clampToRange(projectedX, bounds.minimumX, bounds.maximumX),
    y:
      edge === "top"
        ? bounds.minimumY
        : edge === "bottom"
          ? bounds.maximumY
          : clampToRange(projectedY, bounds.minimumY, bounds.maximumY),
  };
};
