import { recalcOutlines } from './utils/outline';

export const initReactScanOverlay = () => {
  const container = document.getElementById('react-scan-root');
  const shadow = container?.shadowRoot;

  if (!shadow) {
    return null;
  }

  const overlayElement = document.createElement('canvas');
  overlayElement.id = 'react-scan-overlay';

  overlayElement.style.position = 'fixed';
  overlayElement.style.top = '0';
  overlayElement.style.left = '0';
  overlayElement.style.width = '100vw';
  overlayElement.style.height = '100vh';
  overlayElement.style.pointerEvents = 'none';
  overlayElement.style.zIndex = '2147483646';
  overlayElement.setAttribute('aria-hidden', 'true');

  shadow.appendChild(overlayElement);

  const ctx = overlayElement.getContext('2d');
  if (!ctx) return null;

  let resizeScheduled = false;

  const updateCanvasSize = () => {
    const dpi = window.devicePixelRatio || 1;
    overlayElement.width = dpi * window.innerWidth;
    overlayElement.height = dpi * window.innerHeight;
    overlayElement.style.width = `${window.innerWidth}px`;
    overlayElement.style.height = `${window.innerHeight}px`;

    ctx.resetTransform();
    ctx.scale(dpi, dpi);

    resizeScheduled = false;
  };

  window.addEventListener('resize', () => {
    recalcOutlines();
    if (!resizeScheduled) {
      resizeScheduled = true;
      requestAnimationFrame(() => {
        updateCanvasSize();
      });
    }
  });

  window.addEventListener('scroll', () => {
    recalcOutlines();
  });

  updateCanvasSize();

  return ctx;
};
