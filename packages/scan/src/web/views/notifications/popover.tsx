import {
  ComponentProps,
  ReactNode,
  createPortal,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'preact/compat';
import { cn } from '~web/utils/helpers';
import { ToolbarElementContext } from '~web/widget';

type PopoverState = 'closed' | 'opening' | 'open' | 'closing';

/**
 *
 * fixme: very hacky and suboptimal popover (api and implementation)
 */
export const Popover = ({
  children,
  triggerContent,
  wrapperProps,
}: {
  children: ReactNode;
  triggerContent: ReactNode;
  wrapperProps?: ComponentProps<'div'>;
}) => {
  const [popoverState, setPopoverState] = useState<PopoverState>('closed');
  const [elBoundingRect, setElBoundingRect] = useState<DOMRect | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const portalEl = useContext(ToolbarElementContext);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateRect();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateRect = () => {
    if (triggerRef.current && portalEl) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const portalRect = portalEl.getBoundingClientRect();

      const centerX = triggerRect.left + triggerRect.width / 2;
      const centerY = triggerRect.top;

      const rect = new DOMRect(
        centerX - portalRect.left,
        centerY - portalRect.top,
        triggerRect.width,
        triggerRect.height,
      );
      setElBoundingRect(rect);
    }
  };

  useEffect(() => {
    updateRect();
  }, [triggerRef.current]);

  useEffect(() => {
    if (popoverState === 'opening') {
      const timer = setTimeout(() => setPopoverState('open'), 120);
      return () => clearTimeout(timer);
    } else if (popoverState === 'closing') {
      const timer = setTimeout(() => setPopoverState('closed'), 120);
      return () => clearTimeout(timer);
    }
  }, [popoverState]);

  // just incase we didn't capture the mouse leave event because the underlying container moved
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHoveredRef.current && popoverState !== 'closed') {
        setPopoverState('closing');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [popoverState]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    updateRect();
    setPopoverState('opening');
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    updateRect();
    setPopoverState('closing');
  };

  const getPopoverPosition = () => {
    if (!elBoundingRect || !portalEl) return { top: 0, left: 0 };

    const portalRect = portalEl.getBoundingClientRect();
    const popoverWidth = 175;
    const popoverHeight = popoverRef.current?.offsetHeight || 40;
    const safeArea = 5;

    const viewportX = elBoundingRect.x + portalRect.left;
    const viewportY = elBoundingRect.y + portalRect.top;

    let left = viewportX;
    let top = viewportY - 4;

    if (left - popoverWidth / 2 < safeArea) {
      left = safeArea + popoverWidth / 2;
    } else if (left + popoverWidth / 2 > viewportSize.width - safeArea) {
      left = viewportSize.width - safeArea - popoverWidth / 2;
    }

    if (top - popoverHeight < safeArea) {
      top = viewportY + elBoundingRect.height + 4;
    }

    return {
      top: top - portalRect.top,
      left: left - portalRect.left,
    };
  };

  return (
    <>
      {portalEl &&
        elBoundingRect &&
        popoverState !== 'closed' &&
        createPortal(
          <div
            ref={popoverRef}
            className={cn([
              'absolute z-100 bg-white text-black rounded-lg px-3 py-2 shadow-lg',
              'transform transition-all duration-120 ease-[cubic-bezier(0.23,1,0.32,1)]',
              'after:content-[""] after:absolute after:top-[100%]',
              'after:left-1/2 after:-translate-x-1/2',
              'after:w-[10px] after:h-[6px]',
              'after:border-l-[5px] after:border-l-transparent',
              'after:border-r-[5px] after:border-r-transparent',
              'after:border-t-[6px] after:border-t-white',
              'pointer-events-none',
              popoverState === 'opening' || popoverState === 'closing'
                ? 'opacity-0 translate-y-1'
                : 'opacity-100 translate-y-0',
            ])}
            style={{
              top: getPopoverPosition().top + 'px',
              left: getPopoverPosition().left + 'px',
              transform: 'translate(-50%, -100%)',
              minWidth: '175px',
            }}
          >
            {children}
          </div>,
          portalEl,
        )}

      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...wrapperProps}
      >
        {triggerContent}
      </div>
    </>
  );
};
