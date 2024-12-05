import { ReactScanInternals, setOptions } from '../../index';
import { createElement, throttle } from './utils';
import { MONO_FONT } from './outline';
import { INSPECT_TOGGLE_ID } from './inspect-element/inspect-state-machine';
import { getNearestFiberFromElement } from './inspect-element/utils';

let isDragging = false;
let resizingHandler: 'left' | 'right' | null = null;
let initialWidth = 0;
let initialMouseX = 0;

const EDGE_PADDING = 15;
const ANIMATION_DURATION = 300; // milliseconds

export const persistSizeToLocalStorage = throttle((width: number) => {
  localStorage.setItem('react-scan-toolbar-width', String(width));
}, 100);

export const restoreSizeFromLocalStorage = (el: HTMLDivElement) => {
  const width = localStorage.getItem('react-scan-toolbar-width');
  el.style.width = `${width ?? 360}px`;
};

export const createToolbar = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {
      /**/
    };
  }

  const PLAY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
  `;
  const PAUSE_SVG = `
 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
  `;
  const INSPECTING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed-mouse-pointer"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h2"/><path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/></svg>`;
  const FOCUSING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-mouse-pointer"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/></svg>`;
  const NEXT_SVG = `<svg class="nav-button" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h6V5l7 7-7 7v-4H6V9z"/></svg>`;
  const PREVIOUS_SVG = `<svg class="nav-button" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15h-6v4l-7-7 7-7v4h6v6z"/></svg>`;
  const TRANSITION_MS = '150ms';

  const SOUND_ON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>
  `;

  const SOUND_OFF_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-x"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>
  `;

  const toolbar = createElement(`
  <div id="react-scan-toolbar" style="
    position: fixed;
    z-index: 2147483647;
    font-family: ${MONO_FONT};
    font-size: 13px;
    background: transparent;
    user-select: none;
    right: 24px;
    bottom: 24px;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    pointer-events: none;
    max-height: 450px;
  ">
    <div id="react-scan-toolbar-content" style="
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column-reverse;
      cursor: move;
      pointer-events: auto;
      overflow: hidden;
      width: fit-content;
      min-width: min-content;
      position: relative;
    ">
      <div style="display: flex; align-items: center; height: 36px; width: 100%;">
        <button id="${INSPECT_TOGGLE_ID}" style="
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: all ${TRANSITION_MS} ease;
          height: 100%;
          min-width: 36px;
          outline: none;
        " title="Inspect element">
          ${INSPECTING_SVG}
        </button>
        <button id="react-scan-power" style="
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: all ${TRANSITION_MS} ease;
          height: 100%;
          min-width: 36px;
          outline: none;
        " title="Start">
          ${PLAY_SVG}
        </button>
        <button id="react-scan-sound-toggle" style="
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: all ${TRANSITION_MS} ease;
          height: 100%;
          min-width: 36px;
          outline: none;
        " title="Sound On">
          ${SOUND_ON_SVG}
        </button>
        <div style="
          padding: 0 12px;
          color: #fff;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          height: 100%;
          flex: 1;
          justify-content: space-evenly;
        ">
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="react-scan-previous-focus" style="
              padding: 4px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: none;
              color: #999;
              cursor: pointer;
              transition: all ${TRANSITION_MS} ease;
              height: 26px;
              outline: none;
              border: none;
              font-size: 12px;
              white-space: nowrap;
            ">${PREVIOUS_SVG}</button>
            <button id="react-scan-next-focus" style="
              padding: 4px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: none;
              color: #999;
              cursor: pointer;
              transition: all ${TRANSITION_MS} ease;
              height: 26px;
              outline: none;
              border: none;
              font-size: 12px;
              white-space: nowrap;
            ">${NEXT_SVG}</button>
            <span style="font-size: 14px; font-weight: 500;">react-scan</span>
          </div>
        </div>
      </div>
      <div id="react-scan-props" style="
        pointer-events: auto;
        background: #000;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 100%;
        width: 360px;
        overflow: auto;
        max-height: 0;
        transition: max-height 500ms cubic-bezier(0, 0.95, 0.1, 1);
      ">
        <!-- Props content will be injected here -->
      </div>
      <div id="react-scan-resize-handle-left" style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        display: none;
      "></div>
      <div id="react-scan-resize-handle-right" style="
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        display: none;
      "></div>
    </div>
  </div>
`) as HTMLDivElement;

  const styleElement = document.createElement('style');
  styleElement.textContent = `
  #react-scan-toolbar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .react-scan-inspector {
    font-size: 13px;
    width: 360px;
    color: #fff;
    width: 100%;
  }

  .react-scan-header {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    background: #000;
  }

  .react-scan-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .react-scan-header-right {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .react-scan-replay-button {
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    transition: all ${TRANSITION_MS} ease;
    outline: none;
  }

  .react-scan-replay-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .react-scan-component-name {
    font-weight: 500;
    color: #fff;
  }

  .react-scan-metrics {
    color: #888;
    font-size: 12px;
  }

  .react-scan-content {
    padding: 12px;
    background: #000;
  }

  .react-scan-section {
    color: #888;
    margin-bottom: 16px;
    font-size: 12px;
  }

  .react-scan-section:last-child {
    margin-bottom: 0;
  }

  .react-scan-property {
    margin-left: 14px;
    margin-top: 8px;
    position: relative;
  }

  .react-scan-section > .react-scan-property:first-child {
    margin-top: 4px;
  }

  .react-scan-key {
    color: #fff;
  }

  .react-scan-warning {
    padding-right: 4px;
  }

  .react-scan-string {
    color: #9ECBFF;
  }

  .react-scan-number {
    color: #79C7FF;
  }

  .react-scan-boolean {
    color: #56B6C2;
  }

  .react-scan-input {
    background: #000;
    border: none;
    color: #fff;
  }

  .react-scan-object-key {
    color: #fff;
  }

  .react-scan-array {
    color: #fff;
  }

  .react-scan-expandable {
    display: flex;
    align-items: flex-start;
  }

  .react-scan-arrow {
    cursor: pointer;
    content: '▶';
    display: inline-block;
    font-size: 8px;
    margin: 5px 4px 0 0;
    transition: transform ${TRANSITION_MS} ease;
    width: 8px;
    flex-shrink: 0;
    color: #888;
  }

  .react-scan-expanded > .react-scan-arrow {
    transform: rotate(90deg);
  }

  .react-scan-property-content {
    flex: 1;
    min-width: 0;
  }

  .react-scan-hidden {
    display: none;
  }

  .react-scan-array-container {
    overflow-y: auto;
    margin-left: 14px;
    margin-top: 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: 8px;
  }

  .react-scan-nested-object {
    margin-left: 14px;
    margin-top: 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: 8px;
  }

  .react-scan-nested-object > .react-scan-property {
    margin-top: 8px;
  }

  .react-scan-nested-object > .react-scan-property:first-child {
    margin-top: 0;
  }

 .react-scan-preview-line {
  position: relative;
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  display: flex;
  align-items: center;
}
.react-scan-flash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(142, 97, 227, 1);
  pointer-events: none;
  opacity: 0;
  z-index: 999999;
  mix-blend-mode: multiply;
  transition: opacity ${TRANSITION_MS} ease-in;
  border-radius: 4px;
}

.react-scan-flash-active {
  opacity: 0.4;
  transition: opacity 300ms ease-in-out;
}

  /* Hover states */
  #react-scan-toolbar button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  #react-scan-toolbar button:active {
    background: rgba(255, 255, 255, 0.15);
  }

  /* Focus states */
  #react-scan-toolbar button:focus-visible {
    outline: 2px solid #0070F3;
    outline-offset: -2px;
  }

  /* Scrollbar styling */
  .react-scan-props::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .react-scan-props::-webkit-scrollbar-track {
    background: transparent;
  }

  .react-scan-props::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .react-scan-props::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  #react-scan-toolbar::-webkit-scrollbar {
	  width: 4px;
	  height: 4px;
	}

	#react-scan-toolbar::-webkit-scrollbar-track {
	  background: rgba(255, 255, 255, 0.1);
	  border-radius: 4px;
	}

	#react-scan-toolbar::-webkit-scrollbar-thumb {
	  background: rgba(255, 255, 255, 0.3);
	  border-radius: 4px;
	}

	#react-scan-toolbar::-webkit-scrollbar-thumb:hover {
	  background: rgba(255, 255, 255, 0.4);
	}

	/* For Firefox */
	#react-scan-toolbar * {
	  scrollbar-width: thin;
	  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
	}

  .nav-button {
    opacity: var(--nav-opacity, 1);
  }
  `;

  if (document.head) document.head.appendChild(styleElement);

  const inspectBtn = toolbar.querySelector<HTMLButtonElement>(
    `#${INSPECT_TOGGLE_ID}`,
  )!;
  const powerBtn =
    toolbar.querySelector<HTMLButtonElement>('#react-scan-power')!;
  const nextFocusBtn = toolbar.querySelector<HTMLButtonElement>(
    '#react-scan-next-focus',
  )!;
  const previousFocusBtn = toolbar.querySelector<HTMLButtonElement>(
    '#react-scan-previous-focus',
  )!;
  const soundToggleBtn = toolbar.querySelector<HTMLButtonElement>(
    '#react-scan-sound-toggle',
  )!;

  const propContainer =
    toolbar.querySelector<HTMLDivElement>('#react-scan-props')!;
  const toolbarContent = toolbar.querySelector<HTMLElement>(
    '#react-scan-toolbar-content',
  )!;
  const resizeHandleLeft = toolbar.querySelector<HTMLElement>(
    '#react-scan-resize-handle-left',
  )!;
  const resizeHandleRight = toolbar.querySelector<HTMLElement>(
    '#react-scan-resize-handle-right',
  )!;

  let isActive = !ReactScanInternals.isPaused;
  let isSoundOn = false;

  document.documentElement.appendChild(toolbar);

  let initialResizingX = 0;
  let initialX = 0;
  let initialY = 0;
  let currentX = 0;
  let currentY = 0;

  const updateToolbarPosition = (x: number, y: number) => {
    toolbar.style.transform = `translate(${x}px, ${y}px)`;
  };

  updateToolbarPosition(0, 0);

  const ensureToolbarInBounds = () => {
    const toolbarRect = toolbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxX = viewportWidth - toolbarRect.width - EDGE_PADDING;
    const maxY = viewportHeight - toolbarRect.height - EDGE_PADDING;

    const newX = Math.min(maxX, Math.max(EDGE_PADDING, toolbarRect.left));
    const newY = Math.min(maxY, Math.max(EDGE_PADDING, toolbarRect.top));

    const deltaX = newX - toolbarRect.left;
    const deltaY = newY - toolbarRect.top;
    // Only update if position changed
    if (deltaX !== 0 || deltaY !== 0) {
      currentX += deltaX;
      currentY += deltaY;

      toolbar.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      updateToolbarPosition(currentX, currentY);

      setTimeout(() => {
        toolbar.style.transition = '';
      }, ANIMATION_DURATION);
    }
  };

  toolbarContent.addEventListener('mousedown', (event: any) => {
    if (
      event.target === inspectBtn ||
      event.target === powerBtn ||
      event.target === nextFocusBtn ||
      event.target === resizeHandleLeft ||
      event.target === resizeHandleRight
    )
      return;

    isDragging = true;
    const transform = new DOMMatrix(getComputedStyle(toolbar).transform);
    currentX = transform.m41;
    currentY = transform.m42;

    initialX = event.clientX - currentX;
    initialY = event.clientY - currentY;

    toolbar.style.transition = 'none';
    event.preventDefault();
  });

  resizeHandleLeft.addEventListener('mousedown', (e) => {
    resizingHandler = 'left';
    initialResizingX = currentX;
    initialWidth = propContainer.offsetWidth;
    initialMouseX = e.clientX;
    e.preventDefault();
  });

  resizeHandleRight.addEventListener('mousedown', (e) => {
    resizingHandler = 'right';
    initialResizingX = currentX;
    initialWidth = propContainer.offsetWidth;
    initialMouseX = e.clientX;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = e.clientX - initialX;
      const y = e.clientY - initialY;

      currentX = x;
      currentY = y;
      updateToolbarPosition(x, y);
    }

    if (resizingHandler !== null) {
      const resizeSign = resizingHandler === 'left' ? -1 : 1;
      const width = Math.max(
        360,
        initialWidth + resizeSign * (e.clientX - initialMouseX),
      );
      if (resizingHandler === 'right') {
        const x = initialResizingX + (width - initialWidth);
        currentX = x;
        updateToolbarPosition(x, currentY);
      }
      propContainer.style.width = `${width}px`;
      persistSizeToLocalStorage(width);
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      ensureToolbarInBounds();
    }
    if (resizingHandler !== null) {
      resizingHandler = null;
      ensureToolbarInBounds();
    }
  });

  const updateUI = () => {
    powerBtn.innerHTML = isActive ? PAUSE_SVG : PLAY_SVG;
    powerBtn.title = isActive ? 'Stop' : 'Start';
    powerBtn.style.color = isActive ? '#fff' : '#999';
    const focusActive = ReactScanInternals.inspectState.kind === 'focused';

    const isInspectActive =
      ReactScanInternals.inspectState.kind === 'inspecting';

    nextFocusBtn.style.display = focusActive ? 'flex' : 'none';
    previousFocusBtn.style.display = focusActive ? 'flex' : 'none';

    if (isInspectActive) {
      inspectBtn.innerHTML = INSPECTING_SVG;
      inspectBtn.style.color = 'rgba(142, 97, 227, 1)';
    } else if (focusActive) {
      inspectBtn.innerHTML = FOCUSING_SVG;
      inspectBtn.style.color = 'rgba(142, 97, 227, 1)';
    } else {
      inspectBtn.style.color = '#999';
    }

    if (!isInspectActive && !focusActive) {
      propContainer.style.maxHeight = '0';
      propContainer.style.width = 'fit-content';
      propContainer.innerHTML = '';
      resizeHandleLeft.style.display = 'none';
      resizeHandleRight.style.display = 'none';
    } else if (focusActive) {
      resizeHandleLeft.style.display = 'block';
      resizeHandleRight.style.display = 'block';
    }

    soundToggleBtn.innerHTML = isSoundOn ? SOUND_ON_SVG : SOUND_OFF_SVG;
    soundToggleBtn.style.color = isSoundOn ? '#fff' : '#999';
    soundToggleBtn.title = isSoundOn ? 'Sound On' : 'Sound Off';
  };

  powerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isActive = !isActive;
    ReactScanInternals.isPaused = !isActive;
    localStorage.setItem(
      'react-scan-paused',
      String(ReactScanInternals.isPaused),
    );
    updateUI();
  });

  inspectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentState = ReactScanInternals.inspectState;

    switch (currentState.kind) {
      case 'inspecting': {
        propContainer.innerHTML = '';
        propContainer.style.maxHeight = '0';
        propContainer.style.width = 'fit-content';

        ReactScanInternals.inspectState = {
          kind: 'inspect-off',
          propContainer: currentState.propContainer,
        };

        setTimeout(() => {
          if (ReactScanInternals.inspectState.kind === 'inspect-off') {
            // race condition safety net
            ReactScanInternals.inspectState = {
              kind: 'inspect-off',
              propContainer: currentState.propContainer,
            };
          }
        }, 500);
        return;
      }
      case 'focused': {
        propContainer.style.maxHeight = '0';
        propContainer.style.width = 'fit-content';
        propContainer.innerHTML = '';
        ReactScanInternals.inspectState = {
          kind: 'inspecting',
          hoveredDomElement: currentState.focusedDomElement,
          propContainer: currentState.propContainer,
        };
        break;
      }
      case 'inspect-off': {
        ReactScanInternals.inspectState = {
          kind: 'inspecting',
          hoveredDomElement: null,
          propContainer,
        };
        break;
      }
      case 'uninitialized': {
        break;
      }
    }
    updateUI();
  });

  nextFocusBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    const currentState = ReactScanInternals.inspectState;
    if (currentState.kind !== 'focused') return;

    const { focusedDomElement } = currentState;
    if (!focusedDomElement) return;

    const allElements = document.querySelectorAll('*');
    const elements = Array.from(allElements).filter((el): el is HTMLElement => {
      return el instanceof HTMLElement;
    });

    const currentIndex = elements.indexOf(focusedDomElement);
    if (currentIndex === -1) return;

    let nextElement: HTMLElement | null = null;
    let nextIndex = currentIndex + 1;
    const prevFiber = getNearestFiberFromElement(focusedDomElement);

    while (nextIndex < elements.length) {
      const fiber = getNearestFiberFromElement(elements[nextIndex]);
      if (fiber && fiber !== prevFiber) {
        nextElement = elements[nextIndex];
        break;
      }
      nextIndex++;
    }

    if (nextElement) {
      ReactScanInternals.inspectState = {
        kind: 'focused',
        focusedDomElement: nextElement,
        propContainer: currentState.propContainer,
      };
      nextFocusBtn.style.setProperty('--nav-opacity', '1');
      nextFocusBtn.disabled = false;
    } else {
      nextFocusBtn.style.setProperty('--nav-opacity', '0.5');
      nextFocusBtn.disabled = true;
    }
    previousFocusBtn.style.setProperty('--nav-opacity', '1');
    previousFocusBtn.disabled = false;
  });

  previousFocusBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    const currentState = ReactScanInternals.inspectState;
    if (currentState.kind !== 'focused') return;

    const { focusedDomElement } = currentState;
    if (!focusedDomElement) return;

    const allElements = document.querySelectorAll('*');
    const elements = Array.from(allElements).filter((el): el is HTMLElement => {
      return el instanceof HTMLElement;
    });
    const currentIndex = elements.indexOf(focusedDomElement);
    if (currentIndex === -1) return;

    let prevElement: HTMLElement | null = null;
    let prevIndex = currentIndex - 1;
    const currentFiber = getNearestFiberFromElement(focusedDomElement);

    while (prevIndex >= 0) {
      const fiber = getNearestFiberFromElement(elements[prevIndex]);
      if (fiber && fiber !== currentFiber) {
        prevElement = elements[prevIndex];
        break;
      }
      prevIndex--;
    }

    if (prevElement) {
      ReactScanInternals.inspectState = {
        kind: 'focused',
        focusedDomElement: prevElement,
        propContainer: currentState.propContainer,
      };
      previousFocusBtn.style.setProperty('--nav-opacity', '1');
      previousFocusBtn.disabled = false;
    } else {
      previousFocusBtn.style.setProperty('--nav-opacity', '0.5');
      previousFocusBtn.disabled = true;
    }
    nextFocusBtn.style.setProperty('--nav-opacity', '1');
    nextFocusBtn.disabled = false;
  });

  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSoundOn = !isSoundOn;
    setOptions({ playSound: isSoundOn });
    updateUI();
  });

  updateUI();

  const existing = document.getElementById('react-scan-toolbar');
  if (existing) existing.remove();

  if (!toolbar.parentElement) {
    document.documentElement.appendChild(toolbar);
  }

  ReactScanInternals.inspectState = {
    kind: 'inspect-off',
    propContainer,
  };

  ReactScanInternals.subscribe('inspectState', () => {
    updateUI();
  });

  const handleViewportChange = throttle(() => {
    if (!isDragging && resizingHandler !== null) {
      ensureToolbarInBounds();
    }
  }, 100);

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange);

  const cleanup = () => {
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('scroll', handleViewportChange);
  };

  return cleanup;
};
