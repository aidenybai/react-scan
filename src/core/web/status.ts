import { ReactScanInternals } from '../../index';
import { createElement } from './utils';
import { MONO_FONT } from './outline';

export const createStatus = () => {
  const status = createElement(
    `<div id="react-scan-status" title="Number of unnecessary renders and time elapsed" style="position:fixed;bottom:3px;right:3px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;color:white;z-index:2147483647;font-family:${MONO_FONT};display:flex;align-items:center;" aria-hidden="true"></div>`,
  ) as HTMLDivElement;

  // Create a span for status text and assign an ID
  const statusText = document.createElement('span');
  statusText.id = 'react-scan-status-text';
  statusText.textContent = 'hide scanner';
  status.appendChild(statusText);

  // Add the selection button
  const selectButton = createElement(
    `<button id="react-scan-select-button" style="margin-left:8px;background:rgba(0,0,0,0.5);color:white;border:none;padding:4px 8px;border-radius:4px;font-family:${MONO_FONT};cursor:pointer;">Select Area</button>`
  ) as HTMLButtonElement;

  status.appendChild(selectButton);

  let isHidden = localStorage.getItem('react-scan-hidden') === 'true';

  const updateVisibility = () => {
    const canvas = document.getElementById('react-scan-canvas');
    if (!canvas) return;
    canvas.style.display = isHidden ? 'none' : 'block';
    statusText.textContent = isHidden ? 'start ►' : 'stop ⏹';
    ReactScanInternals.isPaused = isHidden;
    if (ReactScanInternals.isPaused) {
      ReactScanInternals.activeOutlines = [];
      ReactScanInternals.scheduledOutlines = [];
    }
    localStorage.setItem('react-scan-hidden', isHidden.toString());
  };

  updateVisibility();

  statusText.addEventListener('click', () => {
    isHidden = !isHidden;
    updateVisibility();
  });

  status.addEventListener('mouseenter', () => {
    statusText.textContent = isHidden ? 'start ►' : 'stop ⏹';
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

  // Variables to track selection state
  let isSelecting = false;
  let selectionStartX = 0;
  let selectionStartY = 0;
  let selectionDiv: HTMLDivElement | null = null;
  let selectionSVG: SVGSVGElement | null = null;
  let selectionRect: SVGRectElement | null = null;

  selectButton.addEventListener('click', () => {
    if (selectionDiv) {
      // Remove existing selection if any
      document.body.removeChild(selectionDiv);
      selectionDiv = null;
      selectionSVG = null;
      selectionRect = null;
      ReactScanInternals.selectedArea = null;
      selectButton.textContent = 'Select Area';
      return;
    }

    isSelecting = true;
    selectButton.disabled = true;
    status.style.pointerEvents = 'none'; // Disable status interactions during selection

    // Handle mouse events for selection
    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      selectionStartX = event.pageX;
      selectionStartY = event.pageY;

      selectionDiv = document.createElement('div');
      selectionDiv.style.position = 'absolute';
      selectionDiv.style.left = `${selectionStartX}px`;
      selectionDiv.style.top = `${selectionStartY}px`;
      selectionDiv.style.pointerEvents = 'auto';
      selectionDiv.style.minWidth = '20px';
      selectionDiv.style.minHeight = '20px';
      selectionDiv.style.zIndex = '2147483647';
      selectionDiv.classList.add('react-scan-selection');
      document.body.appendChild(selectionDiv);

      // Create SVG element for the animated border
      selectionSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      selectionSVG.setAttribute('width', '100%');
      selectionSVG.setAttribute('height', '100%');
      selectionSVG.style.position = 'absolute';
      selectionSVG.style.top = '0';
      selectionSVG.style.left = '0';
      selectionSVG.style.width = '100%';
      selectionSVG.style.height = '100%';
      selectionSVG.style.pointerEvents = 'none'; // Allow interactions to pass through
      selectionDiv!.appendChild(selectionSVG);

      // Create a rectangle in SVG
      selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selectionRect.setAttribute('x', '0');
      selectionRect.setAttribute('y', '0');
      selectionRect.setAttribute('width', '100%');
      selectionRect.setAttribute('height', '100%');
      selectionRect.setAttribute('fill', 'none');
      selectionRect.setAttribute('stroke', 'rgba(115,97,230,0.8)');
      selectionRect.setAttribute('stroke-width', '2');
      selectionRect.setAttribute('vector-effect', 'non-scaling-stroke');
      selectionRect.setAttribute('stroke-dasharray', '8');
      selectionSVG.appendChild(selectionRect);

      // Apply animation to the rectangle using CSS class
      selectionRect.classList.add('react-scan-selection-rect');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (event: MouseEvent) => {
      const currentX = event.pageX;
      const currentY = event.pageY;

      const left = Math.min(selectionStartX, currentX);
      const top = Math.min(selectionStartY, currentY);
      const width = Math.abs(currentX - selectionStartX);
      const height = Math.abs(currentY - selectionStartY);

      selectionDiv!.style.left = `${left}px`;
      selectionDiv!.style.top = `${top}px`;
      selectionDiv!.style.width = `${width}px`;
      selectionDiv!.style.height = `${height}px`;
    };

    const onMouseUp = () => {
      // Clean up selection event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      status.style.pointerEvents = 'auto';
      selectButton.disabled = false;
      selectButton.textContent = 'Clear Selection';
      isSelecting = false;

      // Disable pointer events on the selectionDiv to allow clicks through
      selectionDiv!.style.pointerEvents = 'none';

      // Enable resizing (no dragging)
      enableResize(selectionDiv!);

      // Calculate the selected area
      updateSelectedArea();

      // Update the SVG rectangle size on resize
      const resizeObserver = new ResizeObserver(() => {
        if (selectionSVG && selectionRect) {
          // Ensure SVG covers the full size of the selectionDiv
          selectionSVG.setAttribute('width', '100%');
          selectionSVG.setAttribute('height', '100%');
        }

        updateSelectedArea();
      });
      resizeObserver.observe(selectionDiv!);
    };

    document.addEventListener('mousedown', onMouseDown, { once: true });
  });

  function updateSelectedArea() {
    const rect = selectionDiv!.getBoundingClientRect();
    ReactScanInternals.selectedArea = {
      x: rect.left + window.pageXOffset,
      y: rect.top + window.pageYOffset,
      width: rect.width,
      height: rect.height,
    };
  }

  // Function to enable resizing only
  function enableResize(element: HTMLDivElement) {
    // Create resize handles
    createResizeHandles(element);
  }

  // Function to create custom resize handles
  function createResizeHandles(element: HTMLDivElement) {
    const positions = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    positions.forEach((pos) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${pos}`;
      handle.style.pointerEvents = 'auto'; // Allow pointer events on handles
      element.appendChild(handle);

      handle.addEventListener('mousedown', (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const startX = event.pageX;
        const startY = event.pageY;
        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;
        const startLeft = element.offsetLeft;
        const startTop = element.offsetTop;

        const onMouseMove = (event: MouseEvent) => {
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newLeft = startLeft;
          let newTop = startTop;

          const dx = event.pageX - startX;
          const dy = event.pageY - startY;

          if (pos.includes('e')) {
            newWidth = startWidth + dx;
          }
          if (pos.includes('s')) {
            newHeight = startHeight + dy;
          }
          if (pos.includes('w')) {
            newWidth = startWidth - dx;
            newLeft = startLeft + dx;
          }
          if (pos.includes('n')) {
            newHeight = startHeight - dy;
            newTop = startTop + dy;
          }

          // Enforce minimum size
          newWidth = Math.max(newWidth, 20);
          newHeight = Math.max(newHeight, 20);

          element.style.width = `${newWidth}px`;
          element.style.height = `${newHeight}px`;
          element.style.left = `${newLeft}px`;
          element.style.top = `${newTop}px`;

          updateSelectedArea();
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  // Inject CSS for animated border and resize handles
  const style = document.createElement('style');
  style.innerHTML = `
    .react-scan-selection {
      position: absolute;
      box-sizing: border-box;
      min-width: 20px;
      min-height: 20px;
      z-index: 2147483647;
      user-select: none;
      pointer-events: none; /* Allow clicks to pass through */
    }

    .react-scan-selection-rect {
      animation: stroke-offset 1s linear infinite;
      pointer-events: none; /* Prevent blocking pointer events */
    }

    @keyframes stroke-offset {
      from {
        stroke-dashoffset: 0;
      }
      to {
        stroke-dashoffset: 16;
      }
    }

    .resize-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: rgba(115,97,230,0.8);
      z-index: 2147483648;
      cursor: pointer;
      pointer-events: auto; /* Allow pointer events on handles */
    }

    .resize-handle-nw { top: -5px; left: -5px; cursor: nwse-resize; }
    .resize-handle-ne { top: -5px; right: -5px; cursor: nesw-resize; }
    .resize-handle-sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
    .resize-handle-se { bottom: -5px; right: -5px; cursor: nwse-resize; }
    .resize-handle-n  { top: -5px; left: calc(50% - 5px); cursor: ns-resize; }
    .resize-handle-s  { bottom: -5px; left: calc(50% - 5px); cursor: ns-resize; }
    .resize-handle-e  { top: calc(50% - 5px); right: -5px; cursor: ew-resize; }
    .resize-handle-w  { top: calc(50% - 5px); left: -5px; cursor: ew-resize; }
  `;
  document.head.appendChild(style);

  return status;
};
