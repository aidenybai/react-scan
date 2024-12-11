import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { signal, useSignalEffect, type Signal } from '@preact/signals';
import { render } from 'preact';
import { ReactScanInternals, setOptions, Store } from '../../index';
import { cn } from '../utils';
import { throttle } from './utils';
import {
  INSPECT_TOGGLE_ID,
  type States,
} from './inspect-element/inspect-state-machine';
import { getNearestFiberFromElement } from './inspect-element/utils';
import { RenderPropsAndState } from './components/scan-header';
import { Icon } from './components/icon';

const isSoundOnSignal = signal(false);

// Sizing and positioning signals
const CORNER_KEY = 'react-scan-toolbar-corner';
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
const DEFAULT_CORNER: Corner = 'top-left';  // Default is top-left

// Function to save corner position
const saveCornerPosition = (corner: Corner) => {
  localStorage.setItem(CORNER_KEY, corner);
};

// Update initial position signals
const toolbarX = signal(
  parseInt(
    typeof window !== 'undefined'
      ? localStorage.getItem('react-scan-toolbar-x') ?? '0'
      : '0',
  ),
);

const toolbarY = signal(
  parseInt(
    typeof window !== 'undefined'
      ? localStorage.getItem('react-scan-toolbar-y') ?? '0'
      : '0',
  ),
);

const isDragging = signal(false);
const isResizing = signal(false);

// Separate references for resizing and dragging
const initialWidthRef = { current: 0 }; // Used only for resizing
const initialMouseXRef = { current: 0 }; // Used only for resizing

// Drag references
const dragInitialXOffsetRef = { current: 0 };
const dragInitialYOffsetRef = { current: 0 };

const defaultWidth = 360;
const MIN_WIDTH = 360;
const MAX_WIDTH_RATIO = 0.5;
const EDGE_PADDING = 15;
const ANIMATION_DURATION = 300; // ms
const TRANSITION_TIMING = 'cubic-bezier(0.4, 0, 0.2, 1)';

const persistSizeToLocalStorage = throttle((width: number) => {
  localStorage.setItem('react-scan-toolbar-width', String(width));
}, 100);

export const restoreSizeFromLocalStorage = (): number => {
  const width = localStorage.getItem('react-scan-toolbar-width');
  return width ? parseInt(width, 10) : defaultWidth;
};

const persistPositionToLocalStorage = throttle((x: number, y: number) => {
  localStorage.setItem('react-scan-toolbar-x', String(x));
  localStorage.setItem('react-scan-toolbar-y', String(y));
}, 100);

// Ensure width stays within bounds and handle edge cases
const getConstrainedWidth = (width: number, maxWidth?: number | null): number => {
  // Base width with border adjustment
  const adjustedWidth = width - 2; // 2px for borders

  // Calculate max allowed width based on window or parent
  const maxAllowedWidth = (() => {
    // If valid maxWidth is provided (from parent), use it with padding
    if (typeof maxWidth === 'number' && maxWidth > 0) {
      return maxWidth - (2 * EDGE_PADDING);
    }

    // Fallback to window width with ratio and padding
    return (window.innerWidth * MAX_WIDTH_RATIO) - (2 * EDGE_PADDING);
  })();

  // Ensure width is between MIN_WIDTH and maxAllowedWidth
  return Math.max(
    MIN_WIDTH,
    Math.min(adjustedWidth, maxAllowedWidth)
  );
};

// Update props interface to make isPaused optional
interface ToolbarProps {
  inspectState: Signal<States>;
  isPaused: Signal<boolean>;
  isSoundOn: Signal<boolean>;
  x: Signal<number>;
  y: Signal<number>;
  isDragging: Signal<boolean>;
  isResizing: Signal<boolean>;
}

// Update component to unwrap signals
export const Toolbar = ({
  inspectState,
  isPaused,
  isSoundOn,
  x,
  y,
  isDragging,
  isResizing,
}: ToolbarProps) => {
  const refTimer = useRef<TTimer>();

  const refToolbarContent = useRef<HTMLDivElement>(null);
  const refToolbarContentInitialWidth = useRef<number | undefined>();
  const refPropContainer = useRef<HTMLDivElement>(null);
  const refResizeHandle = useRef<HTMLDivElement>(null);
  const refToolbar = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(restoreSizeFromLocalStorage);

  const focusActive = inspectState.value.kind === 'focused';
  const isInspectActive = inspectState.value.kind === 'inspecting';

  useEffect(() => {
    localStorage.setItem('react-scan-paused', String(!isPaused?.value));
  }, [isPaused?.value]);

  useEffect(() => {
    if (refToolbarContent.current && refPropContainer.current) {
      const maxWidth = getConstrainedWidth(width, refPropContainer.current.parentElement?.clientWidth);
      refToolbarContent.current.style.maxHeight = focusActive ? '50vh' : `39px`;
      refToolbarContent.current.style.maxWidth = `${maxWidth}px`;
      refPropContainer.current.style.minWidth = focusActive ? `${maxWidth - 2}px` : '100%';
    }
  }, [focusActive]);

  // Add a ref to track if initial position is set
  const isInitialPositionSet = useRef(false);

  // Add a single useEffect for position handling
  useEffect(() => {
    if (!refToolbar.current || isInitialPositionSet.current) return;

    // Get saved corner
    const savedCorner = localStorage.getItem(CORNER_KEY) as Corner;
    const rect = refToolbar.current.getBoundingClientRect();

    // Calculate position based on saved corner or default
    let newX, newY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (savedCorner || DEFAULT_CORNER) {
      case 'top-left':
        newX = EDGE_PADDING;
        newY = EDGE_PADDING;
        break;
      case 'top-right':
        newX = viewportWidth - rect.width - EDGE_PADDING;
        newY = EDGE_PADDING;
        break;
      case 'bottom-left':
        newX = EDGE_PADDING;
        newY = viewportHeight - rect.height - EDGE_PADDING;
        break;
      case 'bottom-right':
        newX = viewportWidth - rect.width - EDGE_PADDING;
        newY = viewportHeight - rect.height - EDGE_PADDING;
        break;
    }

    // Set position
    x.value = newX;
    y.value = newY;
    refToolbar.current.style.transform = `translate(${newX}px, ${newY}px)`;
    persistPositionToLocalStorage(newX, newY);

    isInitialPositionSet.current = true;

    refToolbar.current?.classList.add('animate-fade-in', 'animate-duration-300', 'animate-delay-300');
  }, []);

  // Only save corner in ensureToolbarInBounds when actually dragging
  const ensureToolbarInBounds = useCallback(() => {
    if (!refToolbar.current) return;

    const toolbarRect = refToolbar.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

  // Calculate distances to edges
    const distanceToLeft = toolbarRect.left;
    const distanceToRight = viewportWidth - toolbarRect.right;
    const distanceToTop = toolbarRect.top;
    const distanceToBottom = viewportHeight - toolbarRect.bottom;

    // Determine corner based on closest edges
    let corner: Corner;
    if (distanceToTop <= distanceToBottom) {
      corner = distanceToLeft <= distanceToRight ? 'top-left' : 'top-right';
    } else {
      corner = distanceToLeft <= distanceToRight ? 'bottom-left' : 'bottom-right';
    }

    saveCornerPosition(corner);

    // Calculate new position based on corner
    let newX, newY;
    switch (corner) {
      case 'top-left':
        newX = EDGE_PADDING;
        newY = EDGE_PADDING;
        break;
      case 'top-right':
        newX = viewportWidth - toolbarRect.width - EDGE_PADDING;
        newY = EDGE_PADDING;
        break;
      case 'bottom-left':
        newX = EDGE_PADDING;
        newY = viewportHeight - toolbarRect.height - EDGE_PADDING;
        break;
      case 'bottom-right':
        newX = viewportWidth - toolbarRect.width - EDGE_PADDING;
        newY = viewportHeight - toolbarRect.height - EDGE_PADDING;
        break;
    }

    x.value = newX;
    y.value = newY;
    persistPositionToLocalStorage(newX, newY);

    // Smoother transition
    refToolbar.current.style.transition = `transform ${ANIMATION_DURATION}ms ${TRANSITION_TIMING}`;
    refToolbar.current.style.transform = `translate(${newX}px, ${newY}px)`;
    refTimer.current = setTimeout(() => {
      if (refToolbar.current) {
        refToolbar.current.style.transition = '';
      }
    }, ANIMATION_DURATION);
  }, [isDragging.value]);

  useEffect(() => {
    refToolbarContentInitialWidth.current = refToolbarContent.current?.offsetWidth ?? 0;
    const handleViewportChange = throttle(() => {
      if (!isDragging.value && !isResizing.value) {
        ensureToolbarInBounds();
      }
    }, 100);

    handleViewportChange();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange);
    };
  }, []);


  // Mouse events for resizing
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      clearTimeout(refTimer.current);
      if (
        isResizing.value
        && refToolbarContent.current
        && refToolbar.current
        && refPropContainer.current
      ) {
        const w = initialWidthRef.current - (e.clientX - initialMouseXRef.current);

        // Calculate max width with padding consideration
        const maxWidth = (window.innerWidth * MAX_WIDTH_RATIO) - (2 * EDGE_PADDING);
        const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, w));

        refToolbarContent.current.style.maxWidth = `${newWidth}px`;
        refPropContainer.current.style.minWidth = focusActive ? `${newWidth - 2}px` : '100%';


        refTimer.current = setTimeout(() => {
          setWidth(newWidth);
          persistSizeToLocalStorage(newWidth);
        }, 100);
      }
    };

    const onMouseUp = () => {
      if (isDragging.value) {
        isDragging.value = false;
        ensureToolbarInBounds();
      }
      if (isResizing.value) {
        isResizing.value = false;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing.value]);

  const onToggleActive = () => {
    isPaused.value = !isPaused.value;
  };

  useEffect(() => {
    const currentState = Store.inspectState.value;

    if (currentState.kind === 'uninitialized') {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: refPropContainer.current!,
      };
    }
  }, []);

  const onToggleInspect = useCallback(() => {
    const currentState = Store.inspectState.value;
    switch (currentState.kind) {
      case 'inspecting':
        Store.inspectState.value = {
          kind: 'inspect-off',
          propContainer: currentState.propContainer,
        };
        break;
      case 'focused':
        Store.inspectState.value = {
          kind: 'inspect-off',
          propContainer: currentState.propContainer,
        };
        break;
      case 'inspect-off':
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
          propContainer: refPropContainer.current!,
        };
        break;
      case 'uninitialized':
        break;
    }
  }, [Store.inspectState.value]);

  const onSoundToggle = useCallback(() => {
    isSoundOnSignal.value = !isSoundOnSignal.value;
    setOptions({ playSound: isSoundOnSignal.value });
  }, [isSoundOnSignal.value]);

  const onNextFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const focusedDomElement = currentState.focusedDomElement;
    const allElements = Array.from(document.querySelectorAll('*')).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    const currentIndex = allElements.indexOf(focusedDomElement);
    if (currentIndex === -1) return;

    let nextElement: HTMLElement | null = null;
    let nextIndex = currentIndex + 1;
    const prevFiber = getNearestFiberFromElement(focusedDomElement);

    while (nextIndex < allElements.length) {
      const fiber = getNearestFiberFromElement(allElements[nextIndex]);
      if (fiber && fiber !== prevFiber) {
        nextElement = allElements[nextIndex];
        break;
      }
      nextIndex++;
    }

    if (nextElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: nextElement,
        propContainer: currentState.propContainer,
      };
    }
  }, [Store.inspectState.value]);

  const onPreviousFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const focusedDomElement = currentState.focusedDomElement;
    const allElements = Array.from(document.querySelectorAll('*')).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    const currentIndex = allElements.indexOf(focusedDomElement);
    if (currentIndex === -1) return;

    let prevElement: HTMLElement | null = null;
    let prevIndex = currentIndex - 1;
    const currentFiber = getNearestFiberFromElement(focusedDomElement);

    while (prevIndex >= 0) {
      const fiber = getNearestFiberFromElement(allElements[prevIndex]);
      if (fiber && fiber !== currentFiber) {
        prevElement = allElements[prevIndex];
        break;
      }
      prevIndex--;
    }

    if (prevElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: prevElement,
        propContainer: currentState.propContainer,
      };
    }
  }, [Store.inspectState.value]);


  const { inspectIcon, inspectColor } = useMemo(() => {
  let inspectIcon = null;
  let inspectColor = '#999';

  if (isInspectActive) {
    inspectIcon = <Icon name="icon-inspect" />;
    inspectColor = 'rgba(142, 97, 227, 1)';
  } else if (focusActive) {
    inspectIcon = <Icon name="icon-focus" />;
    inspectColor = 'rgba(142, 97, 227, 1)';
  } else {
    inspectIcon = <Icon name="icon-inspect" />;
    inspectColor = '#999';
  }

    return { inspectIcon, inspectColor };
  }, [isInspectActive, focusActive]);

  const onMouseDownToolbar = useCallback((e: MouseEvent) => {
    e.preventDefault();

    const target = e.target as HTMLElement;
    if (target.closest('button') ?? target === refResizeHandle.current) {
      return;
    }

    isDragging.value = true;
    dragInitialXOffsetRef.current = e.clientX - x.value;
    dragInitialYOffsetRef.current = e.clientY - y.value;

    // Remove transition during drag for immediate response
    if (refToolbar.current) {
      refToolbar.current.style.transition = 'none';
    }
  }, [x, y, refToolbar, refResizeHandle]);

  const onMouseDownResize = useCallback((e: MouseEvent) => {
    e.preventDefault();
    isResizing.value = true;
    initialWidthRef.current = refPropContainer.current!.offsetWidth;
    initialMouseXRef.current = e.clientX;
  }, []);

  useEffect(() => {
    if (refToolbar.current) {
      refToolbar.current.style.transform = `translate(${x.value}px, ${y.value}px)`;
    }
  }, []);

  // Update toolbar position during drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.value && refToolbar.current) {
        const newX = e.clientX - dragInitialXOffsetRef.current;
        const newY = e.clientY - dragInitialYOffsetRef.current;
        x.value = newX;
        y.value = newY;
        refToolbar.current.style.transform = `translate(${newX}px, ${newY}px)`;
        persistPositionToLocalStorage(newX, newY);
      }
    };
    const onMouseUp = () => {
      if (isDragging.value) {
        isDragging.value = false;
        ensureToolbarInBounds();
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useSignalEffect(() => {
    if (refToolbar.current) {
      refToolbar.current.style.transform = `translate(${x.value}px, ${y.value}px)`;
    }
  });

  useEffect(() => {
    if (refToolbar.current) {
      const rect = refToolbar.current.getBoundingClientRect();
      x.value = rect.left;
      y.value = rect.top;
    }
  }, []);

  useSignalEffect(() => {
    if (Store.inspectState.value.kind === 'focused') {
      ensureToolbarInBounds();
    }
  });

  useEffect(() => {
    if (!refToolbar.current) return;

    const observer = new ResizeObserver(() => {
      ensureToolbarInBounds();
    });

    observer.observe(refToolbar.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useSignalEffect(() => {
    if (Store.inspectState.value.kind === 'inspecting') {
      // Clear previous props
      if (refPropContainer.current) {
      // refPropContainer.current.innerHTML = '';
      }
    }
  });

  return (
    <div
      id="react-scan-toolbar"
      ref={refToolbar}
      className={cn(
        'fixed',
        'left-0',
        'top-0',
        'flex flex-col-reverse items-end',
        'max-h-[450px]',
        'font-mono text-[13px]',
        'text-sm',
        'bg-transparent',
        'user-select-none',
        'opacity-0',
        'z-[999999999]',
        'animate-fade-in animation-duration-300 animation-delay-300',
      )}
    >
      <div
        id="react-scan-toolbar-content"
        ref={refToolbarContent}
        onMouseDown={onMouseDownToolbar}
        className={cn(
          'flex flex-col',
          'w-fit',
          'bg-black/95',
          'border-1 border-white/10',
          'rounded-lg',
          'pointer-events-auto',
          'cursor-move',
          'text-white',
          'overflow-hidden',
          'transition-all duration-500 ease-[cubic-bezier(0,0.95,0.1,1)]',
          'box-shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
        )}
      >
        <RenderPropsAndState />

        <div
          id="react-scan-props"
          ref={refPropContainer}
          className={cn(
            'bg-black',
            'text-white',
            'h-full',
            'border-t-1 border-white/10',
            'overflow-auto',
          )}
        >
          {/* Inject props content here if needed */}
        </div>

        <div className="flex items-stretch min-h-9 max-h-9 w-full">
          <button
            id={INSPECT_TOGGLE_ID}
            title="Inspect element"
            onClick={onToggleInspect}
            className={cn(
              'flex items-center justify-center',
              'px-3',
            )}
            style={{ color: inspectColor }}
          >
            {inspectIcon}
          </button>
          <button
            id="react-scan-power"
            title={!isPaused.value ? 'Stop' : 'Start'}
            onClick={onToggleActive}
            className={cn(
              'flex items-center justify-center',
              'px-3',
              {
                'text-white': !isPaused.value,
                'text-[#999]': isPaused.value,
              },
            )}
          >
            <Icon name={`icon-${isPaused.value ? 'eye-off' : 'eye'}`} />
          </button>
          <button
            id="react-scan-sound-toggle"
            onClick={onSoundToggle}
            title={isSoundOn.value ? 'Sound On' : 'Sound Off'}
            className={cn(
              'flex items-center justify-center',
              'px-3',
              {
                'text-white': isSoundOn.value,
                'text-[#999]': !isSoundOn.value,
              },
            )}
          >
            <Icon name={`icon-${isSoundOn.value ? 'volume-on' : 'volume-off'}`} />
          </button>

          <div
            className={cn(
              'flex-1 flex items-stretch justify-between',
              'px-3',
              'text-[#999]',
              'border-l-1 border-white/10',
            )}
          >
            {
              focusActive && (
                <div className="flex-1 flex items-stretch justify-center">
                  <button
                    id="react-scan-previous-focus"
                    title="Previous element"
                    onClick={onPreviousFocus}
                    className={cn(
                      'flex items-center justify-center',
                      'px-3',
                    )}
                  >
                    <Icon name="icon-previous" />
                  </button>
                  <button
                    id="react-scan-next-focus"
                    title="Next element"
                    onClick={onNextFocus}
                    className={cn(
                      'flex items-center justify-center',
                      'px-3',
                    )}
                  >
                    <Icon name="icon-next" />
                  </button>
                </div>
              )
            }
            <span className="flex items-center text-sm text-white">
              react-scan
            </span>
          </div>
        </div>

        <div
          id="react-scan-resize-handle"
          ref={refResizeHandle}
          onMouseDown={onMouseDownResize}
          className={cn(
            'absolute',
            'left-0',
            'top-0',
            'bottom-0',
            'w-1',
            'cursor-ew-resize',
            {
              'hidden': !focusActive,
            }
          )}
        />
      </div>
    </div>
  );
};

export const createToolbar = (shadow: ShadowRoot) => {
  if (typeof window === 'undefined') {
    return;
  }

  const ToolbarWrapper = () => (
    <Toolbar
      inspectState={Store.inspectState}
      isPaused={ReactScanInternals.instrumentation?.isPaused!}
      isSoundOn={isSoundOnSignal}
      x={toolbarX}
      y={toolbarY}
      isDragging={isDragging}
      isResizing={isResizing}
    />
  );

  render(<ToolbarWrapper />, shadow);
};
