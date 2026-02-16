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

  // oxlint-disable-next-line react-hooks/exhaustive-deps
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

  const popoverPosition = getPopoverPosition();

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
              'transition-[opacity] duration-120 ease-out',
              'after:content-[""] after:absolute after:top-[100%]',
              'after:left-1/2 after:-translate-x-1/2',
              'after:w-[10px] after:h-[6px]',
              'after:border-l-[5px] after:border-l-transparent',
              'after:border-r-[5px] after:border-r-transparent',
              'after:border-t-[6px] after:border-t-white',
              'pointer-events-none',
              popoverState === 'opening' || popoverState === 'closing'
                ? 'opacity-0'
                : 'opacity-100',
            ])}
            style={{
              top: popoverPosition.top + 'px',
              left: popoverPosition.left + 'px',
              transform: `translate(-50%, calc(-100% - 4px)) scale(${popoverState === 'open' ? 1 : 0.97})`,
              minWidth: '175px',
              willChange: 'opacity, transform',
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
