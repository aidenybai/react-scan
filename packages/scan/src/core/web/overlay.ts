import { recalcOutlines } from './outline';

export const initReactScanOverlay = () => {
  class ReactScanOverlay extends HTMLElement {
    canvas: HTMLCanvasElement;
    // @ts-expect-error will be defined
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    constructor() {
      super();

      const shadow = this.attachShadow({ mode: 'open' });
      this.canvas = document.createElement('canvas');
      this.setupCanvas();

      shadow.appendChild(this.canvas);
    }

    public getContext() {
      return this.ctx;
    }

    setupCanvas() {
      this.canvas.id = 'react-scan-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '2147483646';
      this.canvas.setAttribute('aria-hidden', 'true');

      const isOffscreenCanvasSupported = 'OffscreenCanvas' in globalThis;
      const offscreenCanvas = isOffscreenCanvasSupported
        ? this.canvas.transferControlToOffscreen()
        : this.canvas;

      this.ctx = offscreenCanvas.getContext('2d') as
        | OffscreenCanvasRenderingContext2D
        | CanvasRenderingContext2D;

      let resizeScheduled = false;

      const resize = () => {
        const dpi = window.devicePixelRatio || 1;
        this.ctx.canvas.width = dpi * window.innerWidth;
        this.ctx.canvas.height = dpi * window.innerHeight;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        this.ctx.resetTransform();
        this.ctx.scale(dpi, dpi);

        resizeScheduled = false;
      };

      resize();

      window.addEventListener('resize', () => {
        recalcOutlines();
        if (!resizeScheduled) {
          resizeScheduled = true;
          requestAnimationFrame(() => {
            resize();
          });
        }
      });
      window.addEventListener('scroll', () => {
        recalcOutlines();
      });
    }
  }

  customElements.define('react-scan-overlay', ReactScanOverlay);

  return ReactScanOverlay;
};
