import { SmolWorker } from '~core/worker/smol';
import { SmolWorkerExtension } from '~core/worker/smol-extension';
import { readLocalStorage, removeLocalStorage } from '~web/utils/helpers';

export interface DrawingQueue {
  rect: DOMRect;
  color: {
    r: number;
    g: number;
    b: number;
  };
  alpha: number;
  fillAlpha: number;
}

export interface SerializedOutlineLabel {
  alpha: number;
  rect: DOMRect;
  color: { r: number; g: number; b: number };
  reasons: number;
  labelText: string;
}

export type OutlineWorkerAction =
  | { type: 'set-canvas'; payload: OffscreenCanvas }
  | {
      type: 'fade-out-outline';
      payload: {
        dpi: number;
        drawingQueue: Array<DrawingQueue>;
        mergedLabels: Array<SerializedOutlineLabel>;
      };
    }
  | {
      type: 'resize';
      payload: {
        width: number;
        height: number;
        dpi: number;
      };
    };

function setupOutlineWorker(): (action: OutlineWorkerAction) => Promise<void> {
  const MONO_FONT =
    'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';
  let ctx: OffscreenCanvasRenderingContext2D | undefined;

  const enum Reason {
    Commit = 0b001,
    Unstable = 0b010,
    Unnecessary = 0b100,
  }

  return async (action: OutlineWorkerAction): Promise<void> => {
    switch (action.type) {
      case 'set-canvas':
        {
          const current = action.payload.getContext('2d');
          if (current) {
            ctx = current;
          }
        }
        break;
      case 'resize':
        if (ctx) {
          const { dpi, width, height } = action.payload;
          ctx.canvas.width = width;
          ctx.canvas.height = height;
          ctx.resetTransform();
          ctx.scale(dpi, dpi);
        }
        break;
      case 'fade-out-outline':
        if (ctx) {
          const { dpi, drawingQueue, mergedLabels } = action.payload;
          ctx.clearRect(0, 0, ctx.canvas.width / dpi, ctx.canvas.height / dpi);

          ctx.save();

          for (let i = 0, len = drawingQueue.length; i < len; i++) {
            const { rect, color, alpha, fillAlpha } = drawingQueue[i];
            const rgb = `${color.r},${color.g},${color.b}`;
            ctx.strokeStyle = `rgba(${rgb},${alpha})`;
            ctx.lineWidth = 1;
            ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;

            ctx.beginPath();
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
            ctx.stroke();
            ctx.fill();
          }

          ctx.restore();

          for (let i = 0, len = mergedLabels.length; i < len; i++) {
            const { alpha, rect, color, reasons, labelText } = mergedLabels[i];
            const conditionalText =
              reasons & Reason.Unnecessary ? `${labelText}⚠️` : labelText;
            ctx.save();

            ctx.font = `11px ${MONO_FONT}`;
            const textMetrics = ctx.measureText(conditionalText);
            const textWidth = textMetrics.width;
            const textHeight = 11;

            const labelX: number = rect.x;
            const labelY: number = rect.y - textHeight - 4;

            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
            ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillText(conditionalText, labelX + 2, labelY + textHeight);
          }
        }
        break;
    }
  };
}

const createWorker = () => {
  const useExtensionWorker = readLocalStorage<boolean>('useExtensionWorker');
  removeLocalStorage('useExtensionWorker');

  if (useExtensionWorker) {
    return new SmolWorkerExtension(setupOutlineWorker);
  }
  return new SmolWorker(setupOutlineWorker);
};

export const outlineWorker = createWorker();
