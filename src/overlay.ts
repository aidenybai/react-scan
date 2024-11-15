import { type Fiber } from 'react-reconciler';
import * as React from 'react';
import {
  didFiberRender,
  getDisplayName,
  getTimings,
  getType,
  traverseFiber,
} from './fiber';
import type { OutlineLabel, Outline, Change, OutlinePaintTask } from './types';
import { onIdle, didChange } from './utils';
import { getCurrentOptions } from './auto';
import { MONO_FONT, PURPLE_RGB } from './constants';

let isPaused = false;
let activeOutlines: OutlinePaintTask[] = [];
let animationFrameId: number | null = null;
let pendingOutlines: Outline[] = [];

export const getPendingOutlines = () => pendingOutlines;
export const setPendingOutlines = (outlines: Outline[]) => {
  pendingOutlines = outlines;
  return outlines;
};

const getOutlineKey = (outline: Outline): string => {
  return `${outline.rect.top}-${outline.rect.left}-${outline.rect.width}-${outline.rect.height}`;
};

export const mergeOutlines = (outlines: Outline[]) => {
  const mergedOutlines = new Map<string, Outline>();
  for (let i = 0, len = outlines.length; i < len; i++) {
    const outline = outlines[i];
    const key = getOutlineKey(outline);
    const existingOutline = mergedOutlines.get(key);

    if (!existingOutline) {
      mergedOutlines.set(key, outline);
      continue;
    }
    outline.names.forEach((name) => {
      existingOutline.names.add(name);
    });
    existingOutline.count += outline.count;
    existingOutline.totalTime += outline.totalTime;
    existingOutline.selfTime += outline.selfTime;
  }
  return Array.from(mergedOutlines.values());
};

export const getOutline = (fiber: Fiber | null): Outline | null => {
  if (!fiber || !didFiberRender(fiber) || isPaused) return null;
  const type = getType(fiber.type);
  if (!type) return null;

  const changedProps: Change[] = [];
  let unstable = false;

  const prevProps = fiber.alternate?.memoizedProps;
  const nextProps = fiber.memoizedProps;

  for (const propName in { ...prevProps, ...nextProps }) {
    const prevValue = prevProps?.[propName];
    const nextValue = nextProps?.[propName];

    const changed = didChange(prevValue, nextValue);

    if (
      !changed ||
      React.isValidElement(prevValue) ||
      React.isValidElement(nextValue) ||
      propName === 'children'
    ) {
      continue;
    }
    const changedProp: Change = {
      name: propName,
      prevValue,
      nextValue,
      unstable: changed === 'unstable',
    };
    changedProps.push(changedProp);

    if (changed !== 'unstable') continue;

    unstable = true;
    changedProp.unstable = true;
  }
  // Components re-render anyway, even if their props didn't change unless
  // they're memoized, which is caught by didFiberRender
  // if (!changedProps.length) return null;

  let domFiber = traverseFiber(fiber, (node) => typeof node.type === 'string');
  if (!domFiber) {
    domFiber = traverseFiber(
      fiber,
      (node) => typeof node.type === 'string',
      true,
    );
  }
  if (!domFiber) return null;

  const domNode = domFiber.stateNode;

  if (!(domNode instanceof HTMLElement)) return null;

  if (
    domNode.tagName.toLowerCase().includes('million') ||
    domNode.hasAttribute('data-react-scan-ignore')
  ) {
    return null;
  }

  const style = window.getComputedStyle(domNode);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return null;
  }

  const rect = domNode.getBoundingClientRect();
  const isVisible =
    rect.top >= 0 ||
    rect.left >= 0 ||
    rect.bottom <= window.innerHeight ||
    rect.right <= window.innerWidth;

  if (!isVisible) return null;

  if (!rect.height || !rect.width) return null;

  const name = getDisplayName(fiber.type) ?? '';
  const hasMemoCache = (fiber.updateQueue as any)?.memoCache;

  const { totalTime, selfTime } = getTimings(fiber);

  let prevChangedProps: Record<string, any> | null = null;
  let nextChangedProps: Record<string, any> | null = null;

  for (let i = 0, len = changedProps.length; i < len; i++) {
    const { name, prevValue, nextValue, unstable } = changedProps[i];
    if (!unstable) continue;
    prevChangedProps ??= {};
    nextChangedProps ??= {};
    prevChangedProps[`${name} (prev)`] = prevValue;
    nextChangedProps[`${name} (next)`] = nextValue;
  }

  return {
    rect,
    names: new Set([name]),
    count: 1,
    totalTime,
    selfTime,
    unstable,
    forget: hasMemoCache,
    trigger: false,
    prevChangedProps,
    nextChangedProps,
  };
};

export const flushOutlines = (
  ctx: CanvasRenderingContext2D,
  previousOutlines: Map<string, Outline> = new Map(),
) => {
  const { clearLog } = getCurrentOptions();
  if (clearLog) {
    // eslint-disable-next-line no-console
    console.clear();
  }
  if (!pendingOutlines.length) {
    return;
  }

  const firstOutlines = pendingOutlines;
  pendingOutlines = [];

  requestAnimationFrame(() => {
    void (async () => {
      const secondOutlines = pendingOutlines;
      pendingOutlines = [];
      const mergedOutlines = secondOutlines
        ? mergeOutlines([...firstOutlines, ...secondOutlines])
        : firstOutlines;

      const newPreviousOutlines = new Map<string, Outline>();

      await Promise.all(
        mergedOutlines.map(async (outline) => {
          const key = getOutlineKey(outline);
          if (previousOutlines.has(key)) {
            return;
          }
          await paintOutline(ctx, outline);
          newPreviousOutlines.set(key, outline);
        }),
      );
      if (pendingOutlines.length) {
        flushOutlines(ctx, newPreviousOutlines);
      }
    })();
  });
};

export const paintOutline = (
  ctx: CanvasRenderingContext2D,
  outline: Outline,
) => {
  return new Promise<void>((resolve) => {
    const {
      unstable,
      names,
      count,
      trigger,
      forget,
      prevChangedProps,
      nextChangedProps,
    } = outline;

    const totalFrames = unstable ? 30 : 10;
    const frame = 0;
    const alpha = 0.8;

    let text: string | null = null;
    if (names.size) {
      text = Array.from(names.values())
        .filter((name) => typeof name === 'string' && name.trim())
        .slice(0, 3)
        .join(', ');
      if (text.length > 20) {
        text = `${text.slice(0, 20)}…`;
      }
      if (count > 1) {
        text += ` ×${count}`;
      }
      if (trigger) {
        text = `🔥 ${text}`;
      }
      if (forget) {
        text = `${text} ✨`;
      }
    }

    const { log } = getCurrentOptions();
    if (text && prevChangedProps && nextChangedProps && log) {
      // eslint-disable-next-line no-console
      console.group(
        `%c${text}`,
        'background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;',
      );
      // eslint-disable-next-line no-console
      console.log('Memoize these props:');
      // eslint-disable-next-line no-console
      console.log(prevChangedProps, '!==', nextChangedProps);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    activeOutlines.push({
      outline,
      alpha,
      frame,
      totalFrames,
      resolve,
      text,
    });

    if (!animationFrameId) {
      fadeOutOutline(ctx);
    }
  });
};

export const fadeOutOutline = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const combinedPath = new Path2D();

  let maxStrokeAlpha = 0;
  let maxFillAlpha = 0;

  const pendingLabeledOutlines: OutlineLabel[] = [];

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const animation = activeOutlines[i];
    const { outline, frame, totalFrames } = animation;
    const { rect, unstable } = outline;

    const alphaScalar = unstable ? 0.8 : 0.2;

    animation.alpha = alphaScalar * (1 - frame / totalFrames);

    maxStrokeAlpha = Math.max(maxStrokeAlpha, animation.alpha);
    maxFillAlpha = Math.max(maxFillAlpha, animation.alpha * 0.1);

    combinedPath.rect(rect.x, rect.y, rect.width, rect.height);

    if (unstable) {
      pendingLabeledOutlines.push({
        alpha: animation.alpha,
        outline,
        text: animation.text,
      });
    }

    animation.frame++;

    if (animation.frame > animation.totalFrames) {
      activeOutlines.splice(i, 1);
      animation.resolve();
    }
  }

  ctx.save();

  ctx.strokeStyle = `rgba(${PURPLE_RGB}, ${maxStrokeAlpha})`;
  ctx.lineWidth = 1;
  ctx.fillStyle = `rgba(${PURPLE_RGB}, ${maxFillAlpha})`;

  ctx.stroke(combinedPath);
  ctx.fill(combinedPath);

  ctx.restore();

  for (let i = 0, len = pendingLabeledOutlines.length; i < len; i++) {
    const { alpha, outline, text } = pendingLabeledOutlines[i];
    const { rect } = outline;
    ctx.save();

    if (text) {
      ctx.font = `10px ${MONO_FONT}`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 10;

      const labelX: number = rect.x;
      const labelY: number = rect.y - textHeight - 4;

      ctx.fillStyle = `rgba(${PURPLE_RGB},${alpha})`;
      ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(text, labelX + 2, labelY + textHeight);
    }

    ctx.restore();
  }

  if (activeOutlines.length) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  } else {
    animationFrameId = null;
  }
};

export const createElement = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
};

export const createFullscreenCanvas = () => {
  const canvas = createElement(
    `<canvas id="react-scan-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646" aria-hidden="true"/>`,
  ) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  let resizeScheduled = false;

  const resize = () => {
    const dpi = window.devicePixelRatio;
    canvas.width = dpi * window.innerWidth;
    canvas.height = dpi * window.innerHeight;
    ctx?.scale(dpi, dpi);
    resizeScheduled = false;
  };

  resize();

  window.addEventListener('resize', () => {
    if (!resizeScheduled) {
      resizeScheduled = true;
      requestAnimationFrame(() => {
        resize();
      });
    }
  });

  onIdle(() => {
    const prevCanvas = document.getElementById('react-scan-canvas');
    if (prevCanvas) {
      prevCanvas.remove();
    }
    document.documentElement.appendChild(canvas);
  });

  return ctx;
};

export const createStatus = () => {
  const status = createElement(
    `<div id="react-scan-status" title="Number of unnecessary renders and time elapsed" style="position:fixed;bottom:3px;right:3px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;color:white;z-index:2147483647;font-family:${MONO_FONT}" aria-hidden="true">stop ⏹</div>`,
  ) as HTMLDivElement;

  let isHidden = localStorage.getItem('react-scan-hidden') === 'true';

  const updateVisibility = () => {
    const canvas = document.getElementById('react-scan-canvas');
    if (!canvas) return;
    canvas.style.display = isHidden ? 'none' : 'block';
    status.textContent = isHidden ? 'start ►' : 'stop ⏹';
    isPaused = isHidden;
    if (isPaused) {
      activeOutlines = [];
      pendingOutlines = [];
    }
    localStorage.setItem('react-scan-hidden', isHidden.toString());
  };

  updateVisibility();

  status.addEventListener('click', () => {
    isHidden = !isHidden;
    updateVisibility();
  });

  status.addEventListener('mouseenter', () => {
    status.textContent = isHidden ? 'start ►' : 'stop ⏹';
    status.style.backgroundColor = 'rgba(0,0,0,1)';
  });

  status.addEventListener('mouseleave', () => {
    status.style.backgroundColor = 'rgba(0,0,0,0.5)';
  });

  const prevElement = document.getElementById('react-scan-status');
  if (prevElement) {
    prevElement.remove();
  }
  document.documentElement.appendChild(status);

  return status;
};
