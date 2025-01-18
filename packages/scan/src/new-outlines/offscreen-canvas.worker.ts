import { OUTLINE_ARRAY_SIZE, drawCanvas, initCanvas } from './canvas';
import type { ActiveOutline } from './types';

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let dpr = 1;

const activeOutlines: Map<string, ActiveOutline> = new Map();
let animationFrameId: number | null = null;

const draw = () => {
  if (!ctx || !canvas) return;

  const shouldContinue = drawCanvas(ctx, canvas, dpr, activeOutlines);

  if (shouldContinue) {
    animationFrameId = requestAnimationFrame(draw);
  } else {
    animationFrameId = null;
  }
};

self.onmessage = (event) => {
  const { type } = event.data;

  if (type === 'init') {
    canvas = event.data.canvas;
    dpr = event.data.dpr;

    if (canvas) {
      canvas.width = event.data.width;
      canvas.height = event.data.height;
      ctx = initCanvas(canvas, dpr) as OffscreenCanvasRenderingContext2D;
    }
  }

  if (!canvas || !ctx) return;

  if (type === 'resize') {
    dpr = event.data.dpr;
    canvas.width = event.data.width * dpr;
    canvas.height = event.data.height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    draw();

    return;
  }

  if (type === 'draw-outlines') {
    const { data, names } = event.data;

    const sharedView = new Float32Array(data);
    for (let i = 0; i < sharedView.length; i += OUTLINE_ARRAY_SIZE) {
      const x = sharedView[i + 2];
      const y = sharedView[i + 3];
      const width = sharedView[i + 4];
      const height = sharedView[i + 5];

      const didCommit = sharedView[i + 6] as 0 | 1;
      const outline = {
        id: sharedView[i],
        name: names[i / OUTLINE_ARRAY_SIZE],
        count: sharedView[i + 1],
        x,
        y,
        width,
        height,
        frame: 0,
        targetX: x,
        targetY: y,
        targetWidth: width,
        targetHeight: height,
        didCommit,
      };
      const key = String(outline.id);

      const existingOutline = activeOutlines.get(key);
      if (existingOutline) {
        existingOutline.count++;
        existingOutline.frame = 0;
        existingOutline.targetX = x;
        existingOutline.targetY = y;
        existingOutline.targetWidth = width;
        existingOutline.targetHeight = height;
        existingOutline.didCommit = didCommit;
      } else {
        activeOutlines.set(key, outline);
      }
    }

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(draw);
    }

    return;
  }

  if (type === 'scroll') {
    const { deltaX, deltaY } = event.data;
    for (const outline of activeOutlines.values()) {
      const newX = outline.x - deltaX;
      const newY = outline.y - deltaY;
      outline.targetX = newX;
      outline.targetY = newY;
    }
  }
};
