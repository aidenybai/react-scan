import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../../utils/helpers";
import { ToolbarElementContext } from "../../widget";

type PopoverState = "closed" | "opening" | "open" | "closing";

export const Popover = (props: {
  children: JSX.Element;
  triggerContent: JSX.Element;
  wrapperProps?: JSX.HTMLAttributes<HTMLDivElement>;
}) => {
  const [popoverState, setPopoverState] = createSignal<PopoverState>("closed");
  const [elementBoundingRect, setElementBoundingRect] = createSignal<DOMRect>();
  const [viewportSize, setViewportSize] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const portalElement = useContext(ToolbarElementContext);
  let triggerElement: HTMLDivElement | undefined;
  let popoverElement: HTMLDivElement | undefined;
  let isHovered = false;

  const updateRect = () => {
    if (!triggerElement || !portalElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const portalRect = portalElement.getBoundingClientRect();
    setElementBoundingRect(
      new DOMRect(
        triggerRect.left + triggerRect.width / 2 - portalRect.left,
        triggerRect.top - portalRect.top,
        triggerRect.width,
        triggerRect.height,
      ),
    );
  };

  onMount(() => {
    updateRect();
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateRect();
    };
    const hoverCheckInterval = setInterval(() => {
      if (!isHovered && popoverState() !== "closed") {
        setPopoverState("closing");
      }
    }, 1000);

    window.addEventListener("resize", handleResize);
    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
      clearInterval(hoverCheckInterval);
    });
  });

  createEffect(() => {
    const currentState = popoverState();
    if (currentState !== "opening" && currentState !== "closing") return;

    const timer = setTimeout(
      () => setPopoverState(currentState === "opening" ? "open" : "closed"),
      120,
    );
    onCleanup(() => clearTimeout(timer));
  });

  const popoverPosition = createMemo(() => {
    const boundingRect = elementBoundingRect();
    if (!boundingRect || !portalElement) return { top: 0, left: 0 };

    const portalRect = portalElement.getBoundingClientRect();
    const popoverWidth = 175;
    const popoverHeight = popoverElement?.offsetHeight || 40;
    const safeArea = 5;
    const viewportX = boundingRect.x + portalRect.left;
    const viewportY = boundingRect.y + portalRect.top;
    let left = viewportX;
    let top = viewportY - 4;

    if (left - popoverWidth / 2 < safeArea) {
      left = safeArea + popoverWidth / 2;
    } else if (left + popoverWidth / 2 > viewportSize().width - safeArea) {
      left = viewportSize().width - safeArea - popoverWidth / 2;
    }

    if (top - popoverHeight < safeArea) {
      top = viewportY + boundingRect.height + 4;
    }

    return {
      top: top - portalRect.top,
      left: left - portalRect.left,
    };
  });

  const handleMouseEnter = () => {
    isHovered = true;
    updateRect();
    setPopoverState("opening");
  };

  const handleMouseLeave = () => {
    isHovered = false;
    updateRect();
    setPopoverState("closing");
  };

  return (
    <>
      <Show
        when={
          portalElement && elementBoundingRect() && popoverState() !== "closed" && portalElement
        }
      >
        {(mountElement) => (
          <Portal mount={mountElement()}>
            <div
              ref={popoverElement}
              class={cn([
                "absolute z-100 bg-white text-black rounded-lg px-3 py-2 shadow-lg",
                "transition-[opacity] duration-120 ease-out",
                'after:content-[""] after:absolute after:top-[100%]',
                "after:left-1/2 after:-translate-x-1/2",
                "after:w-[10px] after:h-[6px]",
                "after:border-l-[5px] after:border-l-transparent",
                "after:border-r-[5px] after:border-r-transparent",
                "after:border-t-[6px] after:border-t-white",
                "pointer-events-none",
                popoverState() === "opening" || popoverState() === "closing"
                  ? "opacity-0"
                  : "opacity-100",
              ])}
              style={{
                top: `${popoverPosition().top}px`,
                left: `${popoverPosition().left}px`,
                transform: `translate(-50%, calc(-100% - 4px)) scale(${
                  popoverState() === "open" ? 1 : 0.97
                })`,
                "min-width": "175px",
                "will-change": "opacity, transform",
              }}
            >
              {props.children}
            </div>
          </Portal>
        )}
      </Show>

      <div
        {...props.wrapperProps}
        ref={triggerElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {props.triggerContent}
      </div>
    </>
  );
};
