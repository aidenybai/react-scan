import { ReactScanInternals } from '../../index';

const MINIMAP_MAX_HEIGHT = 200;
const MINIMAP_MIN_HEIGHT = 100;
const MINIMAP_CANVAS_ID = 'react-scan-minimap-canvas';

const toCanvasCoordinates = (
  rootElement: HTMLElement,
  scaleX: number,
  scaleY: number,
  dpr: number,
) => {
  const rootRect = rootElement.getBoundingClientRect();

  return (x: number, y: number): [number, number] => {
    const relativeX = (x - rootRect.left) * scaleX / dpr;
    const relativeY = (y - rootRect.top) * scaleY / dpr;
    return [relativeX, relativeY];
  };
};

const hasOverflowChildren = (element: HTMLElement, rootElement: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const rootRect = rootElement.getBoundingClientRect();

  return (
    rect.bottom < rootRect.top ||
    rect.top > rootRect.bottom ||
    rect.right < rootRect.left ||
    rect.left > rootRect.right
  );
};

const drawChildren = (
  element: HTMLElement,
  ctx: CanvasRenderingContext2D,
  scaleFn: (x: number, y: number) => [number, number],
  rootElement: HTMLElement,
  depth = 100,
) => {
  if (depth === 0) return;

  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const [x1, y1] = scaleFn(rect.left, rect.top);
  const [x2, y2] = scaleFn(rect.right, rect.bottom);

  const width = x2 - x1;
  const height = y2 - y1;

  if (width < 0 || height < 0) return;

  const isOffscreen = hasOverflowChildren(element, rootElement);
  const activeOutline = ReactScanInternals.activeOutlines.find(
    (ao) => ao.outline.domNode === element
  );

  if (activeOutline) {
    const alpha = activeOutline.alpha;
    ctx.strokeStyle = `rgba(147, 112, 219, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, width, height);
  } else {
    // Only draw if there are active outlines somewhere
    if (ReactScanInternals.activeOutlines.length > 0) {
      ctx.strokeStyle = isOffscreen ? 'rgba(128, 128, 128, 0.3)' : 'rgba(147, 112, 219, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, y1, width, height);
    }
  }

  // Draw children
  const children = Array.from(element.children) as HTMLElement[];
  for (const child of children) {
    const style = window.getComputedStyle(child);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      drawChildren(child, ctx, scaleFn, rootElement, depth - 1);
    }
  }
};

const drawMinimapInsideViewportWindow = (
  ctx: CanvasRenderingContext2D,
  minimap: {
    topLeft: [number, number];
    bottomRight: [number, number];
    scaleFn: (x: number, y: number) => [number, number];
    dpr: number;
  },
  rootElement: HTMLElement,
) => {
  ctx.save();
  ctx.scale(minimap.dpr, minimap.dpr);

  const rootRect = rootElement.getBoundingClientRect();
  const viewportRect = {
    left: window.scrollX,
    top: window.scrollY,
    right: window.scrollX + window.innerWidth,
    bottom: window.scrollY + window.innerHeight
  };

  // Convert viewport coordinates to be relative to the root element
  const relativeViewport = {
    left: (viewportRect.left - rootRect.left) / rootRect.width,
    top: (viewportRect.top - rootRect.top) / rootRect.height,
    right: (viewportRect.right - rootRect.left) / rootRect.width,
    bottom: (viewportRect.bottom - rootRect.top) / rootRect.height
  };

  // Get canvas dimensions
  const canvasWidth = ctx.canvas.width / minimap.dpr;
  const canvasHeight = ctx.canvas.height / minimap.dpr;

  // Calculate viewport position in canvas coordinates
  const x1 = relativeViewport.left * canvasWidth;
  const y1 = relativeViewport.top * canvasHeight;
  const x2 = relativeViewport.right * canvasWidth;
  const y2 = relativeViewport.bottom * canvasHeight;

  const width = x2 - x1;
  const height = y2 - y1;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x1, y1, width, height);

  ctx.restore();
};

const drawMinimap = (
  ctx: CanvasRenderingContext2D,
  minimap: {
    topLeft: [number, number];
    bottomRight: [number, number];
    scaleFn: (x: number, y: number) => [number, number];
    dpr: number;
  },
  rootElement: HTMLElement,
) => {
  ctx.save();
  ctx.scale(minimap.dpr, minimap.dpr);
  ctx.clearRect(0, 0, ctx.canvas.width / minimap.dpr, ctx.canvas.height / minimap.dpr);

  // Draw root element first
  drawChildren(rootElement, ctx, minimap.scaleFn, rootElement, 100);

  // Draw scheduled outlines
  ReactScanInternals.scheduledOutlines.forEach((outline) => {
    const element = outline.domNode;
    if (element !== rootElement) {
      drawChildren(element, ctx, minimap.scaleFn, rootElement, 100);
    }
  });

  // Draw active outlines
  ReactScanInternals.activeOutlines.forEach((activeOutline) => {
    const element = activeOutline.outline.domNode;
    if (element !== rootElement) {
      drawChildren(element, ctx, minimap.scaleFn, rootElement, 100);
    }
  });

  ctx.restore();
};

const resizeCanvas = (element: HTMLElement, canvas: HTMLCanvasElement) => {
  const dpr = window.devicePixelRatio || 1;
  const elementRect = element.getBoundingClientRect();
  const containerWidth = canvas.parentElement?.clientWidth ?? 360;
  const contentWidth = containerWidth - 16; // Account for margins
  const contentHeight = elementRect.height;

  // Calculate height while maintaining aspect ratio
  const elementAspectRatio = elementRect.width / elementRect.height;
  const canvasHeight = Math.max(MINIMAP_MIN_HEIGHT, Math.min(MINIMAP_MAX_HEIGHT, contentWidth / elementAspectRatio));

  // Set canvas dimensions with device pixel ratio
  canvas.width = contentWidth * dpr;
  canvas.height = canvasHeight * dpr;

  // Set CSS dimensions
  canvas.style.width = `${contentWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  // Return scale factors
  return {
    scaleX: (contentWidth * dpr) / elementRect.width,
    scaleY: (canvasHeight * dpr) / contentHeight,
    dpr
  };
};

export const createMinimapCanvas = () => {
  if (typeof window === 'undefined') return;

  let canvas = document.getElementById(
    MINIMAP_CANVAS_ID,
  ) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = MINIMAP_CANVAS_ID;
    canvas.style.cssText = `
      pointer-events: none;
      background: rgb(0, 0, 0);
      border-radius: 4px;
      display: none;
      opacity: 0.9;
      margin: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: calc(100% - 16px);
    `;
  }

  // Find the toolbar's minimap container to insert the canvas
  const toolbar = document.getElementById('react-scan-toolbar');
  const minimapContainer = toolbar?.querySelector('#react-scan-minimap-container');

  if (minimapContainer) {
    minimapContainer.innerHTML = ''; // Clear existing content
    minimapContainer.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const unsubscribeFns: (() => void)[] = [];

  const unsubscribeAll = () => {
    unsubscribeFns.forEach((unSub) => unSub());
    unsubscribeFns.length = 0;
  };

  // Subscribe to outline state changes
  const unsubOutlines = ReactScanInternals.subscribeMultiple(
    ['activeOutlines', 'scheduledOutlines'],
    (store) => {
      const hasActiveOutlines = store.activeOutlines.length > 0;
      const hasScheduledOutlines = store.scheduledOutlines.length > 0;
      canvas.style.display = hasActiveOutlines || hasScheduledOutlines ? 'block' : 'none';
    }
  );
  unsubscribeFns.push(unsubOutlines);

  // Subscribe to inspect state changes
  const unsubInspect = ReactScanInternals.subscribeMultiple(['inspectState'], (store) => {
    const inspectState = store.inspectState;

    switch (inspectState.kind) {
      case 'focused': {
        const element = inspectState.focusedDomElement;
        const { scaleX, scaleY, dpr } = resizeCanvas(element, canvas);
        const scaleFn = toCanvasCoordinates(element, scaleX, scaleY, dpr);

        const minimap = {
          topLeft: [0, 0] as [number, number],
          bottomRight: [element.scrollWidth, element.scrollHeight] as [number, number],
          scaleFn,
          dpr
        };

        let animationFrameId: number;

        const draw = () => {
          drawMinimap(ctx, minimap, element);
          drawMinimapInsideViewportWindow(ctx, minimap, element);
          animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
          cancelAnimationFrame(animationFrameId);
        };
      }
      default: {
        return;
      }
    }
  });
  unsubscribeFns.push(unsubInspect);

  return () => {
    unsubscribeAll();
    canvas?.parentNode?.removeChild(canvas);
  };
};
