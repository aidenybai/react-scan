import { outlineWorker } from '@web-utils/outline-worker';
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

  const dpi = window.devicePixelRatio || 1;
  overlayElement.width = dpi * window.innerWidth;
  overlayElement.height = dpi * window.innerHeight;

  let resizeScheduled = false;

  const updateCanvasSize = () => {
    const dpi = window.devicePixelRatio || 1;

    outlineWorker
      .call({
        type: 'resize',
        payload: {
          width: dpi * window.innerWidth,
          height: dpi * window.innerHeight,
          dpi,
        },
      })
      .then(
        () => {
          resizeScheduled = false;
        },
        () => {
          resizeScheduled = false;
        },
      );
  };

  window.addEventListener('resize', () => {
    recalcOutlines();

    if (!resizeScheduled) {
      resizeScheduled = true;
      updateCanvasSize();
    }
  });

  window.addEventListener('scroll', () => {
    recalcOutlines();
  });

  const offscreen = overlayElement.transferControlToOffscreen();

  outlineWorker
    .call(
      {
        type: 'set-canvas',
        payload: offscreen,
      },
      {
        transfer: [offscreen],
      },
    )
    .then(console.log, console.error);

  updateCanvasSize();

  return offscreen;
};
