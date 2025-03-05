import { signal } from '@preact/signals';
import { iife } from './performance-utils';

export interface HeatmapOverlay {
  boundingRect: DOMRect;
  ms: number;
  name: string;
}

export let highlightCanvas: HTMLCanvasElement | null = null;
export let highlightCtx: CanvasRenderingContext2D | null = null;

let animationFrame: number | null = null;

export type TransitionHighlightState = {
  kind: 'transition';
  transitionTo: {
    name: string;
    rects: Array<DOMRect>;
    alpha: number;
  };
  current: {
    name: string;
    rects: Array<DOMRect>;
    alpha: number;
  } | null;
};
type HighlightState =
  | TransitionHighlightState
  | {
      kind: 'move-out';
      current: {
        name: string;
        rects: Array<DOMRect>;
        alpha: number;
      };
    }
  | {
      kind: 'idle';
      current: {
        name: string;
        rects: Array<DOMRect>;
      } | null;
    };

export const HighlightStore = signal<HighlightState>({
  kind: 'idle',
  current: null,
});

let currFrame: ReturnType<typeof requestAnimationFrame> | null = null;
export const drawHighlights = () => {
  if (currFrame) {
    cancelAnimationFrame(currFrame);
  }
  currFrame = requestAnimationFrame(() => {
    if (!highlightCanvas || !highlightCtx) {
      return;
    }

    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

    const color = 'hsl(271, 76%, 53%)';
    const state = HighlightStore.value;
    const { alpha, current } = iife(() => {
      switch (state.kind) {
        case 'transition': {
          const current =
            state.current?.alpha && state.current.alpha > 0
              ? state.current
              : state.transitionTo;
          return {
            alpha: current ? current.alpha : 0,
            current,
          };
        }
        case 'move-out': {
          return { alpha: state.current?.alpha ?? 0, current: state.current };
        }
        case 'idle': {
          return { alpha: 1, current: state.current };
        }
      }
      // exhaustive check
      state satisfies never;
    });

    for (const rect of current?.rects ?? []) {
      if (!highlightCtx) {
        // typescript cant tell this closure is synchronous/non-escaping
        return;
      }
      highlightCtx.shadowColor = color;
      highlightCtx.shadowBlur = 6;
      highlightCtx.strokeStyle = color;
      highlightCtx.lineWidth = 2;

      highlightCtx.globalAlpha = alpha;

      highlightCtx.beginPath();
      highlightCtx.rect(rect.left, rect.top, rect.width, rect.height);
      highlightCtx.stroke();

      highlightCtx.shadowBlur = 0;
      highlightCtx.beginPath();
      highlightCtx.rect(rect.left, rect.top, rect.width, rect.height);
      highlightCtx.stroke();
    }

    switch (state.kind) {
      case 'move-out': {
        if (state.current.alpha === 0) {
          HighlightStore.value = {
            kind: 'idle',
            current: null,
          };
          return;
        }
        if (state.current.alpha <= 0.01) {
          state.current.alpha = 0;
        }
        state.current.alpha = Math.max(0, state.current.alpha - 0.03);
        drawHighlights();
        return;
      }
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: check!!!
      case 'transition': {
        if (state.current && state.current.alpha > 0) {
          state.current.alpha = Math.max(0, state.current.alpha - 0.03);
          drawHighlights();
          return;
        }

        // invariant, state.current.alpha === 0
        if (state.transitionTo.alpha === 1) {
          HighlightStore.value = {
            kind: 'idle',
            current: state.transitionTo,
          };
          return;
        }

        // intentionally linear
        state.transitionTo.alpha = Math.min(state.transitionTo.alpha + 0.03, 1);

        drawHighlights();
      }
      case 'idle': {
        // no-op
        return;
      }
    }
  });
};

let handleResizeListener: (() => void) | null = null;
export const createHighlightCanvas = (root: HTMLElement) => {
  highlightCanvas = document.createElement('canvas');
  highlightCtx = highlightCanvas.getContext('2d', { alpha: true });
  if (!highlightCtx) return null;

  const dpr = window.devicePixelRatio || 1;
  const { innerWidth, innerHeight } = window;

  highlightCanvas.style.width = `${innerWidth}px`;
  highlightCanvas.style.height = `${innerHeight}px`;
  highlightCanvas.width = innerWidth * dpr;
  highlightCanvas.height = innerHeight * dpr;
  highlightCanvas.style.position = 'fixed';
  highlightCanvas.style.left = '0';
  highlightCanvas.style.top = '0';
  highlightCanvas.style.pointerEvents = 'none';
  highlightCanvas.style.zIndex = '2147483600';

  highlightCtx.scale(dpr, dpr);

  root.appendChild(highlightCanvas);

  if (handleResizeListener) {
    window.removeEventListener('resize', handleResizeListener);
  }

  const handleResize = () => {
    if (!highlightCanvas || !highlightCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const { innerWidth, innerHeight } = window;

    highlightCanvas.style.width = `${innerWidth}px`;
    highlightCanvas.style.height = `${innerHeight}px`;
    highlightCanvas.width = innerWidth * dpr;
    highlightCanvas.height = innerHeight * dpr;
    highlightCtx.scale(dpr, dpr);

    drawHighlights();
  };
  handleResizeListener = handleResize;

  window.addEventListener('resize', handleResize);

  HighlightStore.subscribe(() => {
    requestAnimationFrame(() => {
      drawHighlights();
    });
  });
};

export function cleanup() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  if (highlightCanvas?.parentNode) {
    highlightCanvas.parentNode.removeChild(highlightCanvas);
  }
  highlightCanvas = null;
  highlightCtx = null;
}
