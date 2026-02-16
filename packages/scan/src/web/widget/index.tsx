import { createContext, type JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Store, ReactScanInternals } from "~core/index";
import {
  cn,
  saveLocalStorage,
  removeLocalStorage,
  readLocalStorage,
} from "~web/utils/helpers";
import { Content } from "~web/views";
import { ScanOverlay } from "~web/views/inspector/overlay";
import {
  LOCALSTORAGE_KEY,
  LOCALSTORAGE_COLLAPSED_KEY,
  MIN_SIZE,
  SAFE_AREA,
  LOCALSTORAGE_LAST_VIEW_KEY,
} from "../constants";
import {
  defaultWidgetConfig,
  signalRefWidget,
  signalWidget,
  signalWidgetViews,
  updateDimensions,
  type WidgetStates,
} from "../state";
import {
  calculateBoundedSize,
  calculatePosition,
  getBestCorner,
} from "./helpers";
import { ResizeHandle } from "./resize-handle";
import { signalWidgetCollapsed } from "~web/state";
import { Icon } from "~web/components/icon";
import { Corner } from "./types";
import type { CollapsedPosition } from "./types";

const COLLAPSED_SIZE = {
  horizontal: { width: 20, height: 48 },
  vertical: { width: 48, height: 20 },
} as const;

export const Widget = () => {
  const refWidget = useRef<HTMLDivElement | null>(null);
  const refShouldOpen = useRef<boolean>(false);

  const refInitialMinimizedWidth = useRef<number>(0);
  const refInitialMinimizedHeight = useRef<number>(0);
  const refExpandingFromCollapsed = useRef<boolean>(false);

  const updateWidgetPosition = useCallback((shouldSave = true) => {
    if (!refWidget.current) return;

    const { corner } = signalWidget.value;
    let newWidth: number;
    let newHeight: number;

    if (signalWidgetCollapsed.value) {
      const orientation =
        signalWidgetCollapsed.value.orientation || "horizontal";
      const size = COLLAPSED_SIZE[orientation];
      newWidth = size.width;
      newHeight = size.height;
    } else if (refShouldOpen.current) {
      const lastDims = signalWidget.value.lastDimensions;
      newWidth = calculateBoundedSize(lastDims.width, 0, true);
      newHeight = calculateBoundedSize(lastDims.height, 0, false);

      if (refExpandingFromCollapsed.current) {
        refExpandingFromCollapsed.current = false;
      }
    } else {
      newWidth = refInitialMinimizedWidth.current;
      newHeight = refInitialMinimizedHeight.current;
    }

    const newPosition = calculatePosition(corner, newWidth, newHeight);

    // When collapsed, override position so arrow is flush against the viewport edge.
    let finalPosition = newPosition;
    if (signalWidgetCollapsed.value) {
      const { corner: collapsedCorner, orientation = "horizontal" } =
        signalWidgetCollapsed.value;
      const size = COLLAPSED_SIZE[orientation];

      switch (collapsedCorner) {
        case "top-left":
          finalPosition =
            orientation === "horizontal"
              ? { x: -1, y: SAFE_AREA }
              : { x: SAFE_AREA, y: -1 };
          break;
        case "bottom-left":
          finalPosition =
            orientation === "horizontal"
              ? { x: -1, y: window.innerHeight - size.height - SAFE_AREA }
              : { x: SAFE_AREA, y: window.innerHeight - size.height + 1 };
          break;
        case "top-right":
          finalPosition =
            orientation === "horizontal"
              ? { x: window.innerWidth - size.width + 1, y: SAFE_AREA }
              : { x: window.innerWidth - size.width - SAFE_AREA, y: -1 };
          break;
        case "bottom-right":
        default:
          finalPosition =
            orientation === "horizontal"
              ? {
                  x: window.innerWidth - size.width + 1,
                  y: window.innerHeight - size.height - SAFE_AREA,
                }
              : {
                  x: window.innerWidth - size.width - SAFE_AREA,
                  y: window.innerHeight - size.height + 1,
                };
          break;
      }
    }

    const isTooSmall =
      newWidth < MIN_SIZE.width || newHeight < MIN_SIZE.initialHeight;
    const shouldPersist = shouldSave && !isTooSmall;

    const container = refWidget.current;
    const containerStyle = container.style;

    let rafId: number | null = null;
    const onTransitionEnd = () => {
      updateDimensions();
      container.removeEventListener("transitionend", onTransitionEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    container.addEventListener("transitionend", onTransitionEnd);
    containerStyle.transition = "all 0.25s cubic-bezier(0, 0, 0.2, 1)";

    rafId = requestAnimationFrame(() => {
      containerStyle.width = `${newWidth}px`;
      containerStyle.height = `${newHeight}px`;
      containerStyle.transform = `translate3d(${finalPosition.x}px, ${finalPosition.y}px, 0)`;
      rafId = null;
    });

    const newDimensions = {
      isFullWidth: newWidth >= window.innerWidth - SAFE_AREA * 2,
      isFullHeight: newHeight >= window.innerHeight - SAFE_AREA * 2,
      width: newWidth,
      height: newHeight,
      position: finalPosition,
    };

    signalWidget.value = {
      corner,
      dimensions: newDimensions,
      lastDimensions: refShouldOpen
        ? signalWidget.value.lastDimensions
        : newWidth > refInitialMinimizedWidth.current
          ? newDimensions
          : signalWidget.value.lastDimensions,
      componentsTree: signalWidget.value.componentsTree,
    };

    if (shouldPersist) {
      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: signalWidget.value.corner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions,
        componentsTree: signalWidget.value.componentsTree,
      });
    }

    updateDimensions();
  }, []);

  const handleDrag = useCallback(
    (e: JSX.TargetedPointerEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!refWidget.current || (e.target as HTMLElement).closest("button"))
        return;

      const container = refWidget.current;
      const containerStyle = container.style;
      const { dimensions } = signalWidget.value;

      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;

      const initialX = dimensions.position.x;
      const initialY = dimensions.position.y;

      let currentX = initialX;
      let currentY = initialY;
      let rafId: number | null = null;
      let hasMoved = false;
      let lastMouseX = initialMouseX;
      let lastMouseY = initialMouseY;

      const handlePointerMove = (e: globalThis.PointerEvent) => {
        if (rafId) return;

        hasMoved = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;

          currentX = Number(initialX) + deltaX;
          currentY = Number(initialY) + deltaY;

          containerStyle.transition = "none";
          containerStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

          const widgetRight = currentX + dimensions.width;
          const widgetBottom = currentY + dimensions.height;

          const outsideLeft = Math.max(0, -currentX);
          const outsideRight = Math.max(0, widgetRight - window.innerWidth);
          const outsideTop = Math.max(0, -currentY);
          const outsideBottom = Math.max(0, widgetBottom - window.innerHeight);

          const horizontalOutside = Math.min(
            dimensions.width,
            outsideLeft + outsideRight
          );
          const verticalOutside = Math.min(
            dimensions.height,
            outsideTop + outsideBottom
          );
          const areaOutside =
            horizontalOutside * dimensions.height +
            verticalOutside * dimensions.width -
            horizontalOutside * verticalOutside;
          const totalArea = dimensions.width * dimensions.height;

          // todo: delete this doesn't do anything
          let shouldCollapse = areaOutside > totalArea * 0.35;

          if (!shouldCollapse && ReactScanInternals.options.value.showFPS) {
            const fpsRight = currentX + dimensions.width;
            const fpsLeft = fpsRight - 100;

            const fpsFullyOutside =
              fpsRight <= 0 ||
              fpsLeft >= window.innerWidth ||
              currentY + dimensions.height <= 0 ||
              currentY >= window.innerHeight;

            shouldCollapse = fpsFullyOutside;
          }

          if (shouldCollapse) {
            const widgetCenterX = currentX + dimensions.width / 2;
            const widgetCenterY = currentY + dimensions.height / 2;
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;

            let targetCorner: Corner;
            if (widgetCenterX < screenCenterX) {
              targetCorner =
                widgetCenterY < screenCenterY ? "top-left" : "bottom-left";
            } else {
              targetCorner =
                widgetCenterY < screenCenterY ? "top-right" : "bottom-right";
            }

            let orientation: "horizontal" | "vertical";
            const horizontalOverflow = Math.max(outsideLeft, outsideRight);
            const verticalOverflow = Math.max(outsideTop, outsideBottom);

            orientation =
              horizontalOverflow > verticalOverflow ? "horizontal" : "vertical";

            signalWidget.value = {
              ...signalWidget.value,
              corner: targetCorner,
              lastDimensions: {
                ...dimensions,
                position: calculatePosition(
                  targetCorner,
                  dimensions.width,
                  dimensions.height
                ),
              },
            };

            const collapsedPosition: CollapsedPosition = {
              corner: targetCorner,
              orientation,
            };

            signalWidgetCollapsed.value = collapsedPosition;
            saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, collapsedPosition);
            saveLocalStorage(LOCALSTORAGE_KEY, signalWidget.value);
            updateWidgetPosition(false);

            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerEnd);
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }

          rafId = null;
        });
      };

      const handlePointerEnd = () => {
        if (!container) return;

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);

        // Calculate total movement distance
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
        const totalMovement = Math.sqrt(
          totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY
        );

        // Only consider it a move if we moved more than 60 pixels
        if (!hasMoved || totalMovement < 60) return;

        const newCorner = getBestCorner(
          lastMouseX,
          lastMouseY,
          initialMouseX,
          initialMouseY,
          Store.inspectState.value.kind === "focused" ? 80 : 40
        );

        if (newCorner === signalWidget.value.corner) {
          containerStyle.transition =
            "transform 0.25s cubic-bezier(0, 0, 0.2, 1)";
          const currentPosition = signalWidget.value.dimensions.position;
          requestAnimationFrame(() => {
            containerStyle.transform = `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`;
          });

          return;
        }

        const snappedPosition = calculatePosition(
          newCorner,
          dimensions.width,
          dimensions.height
        );

        if (currentX === initialX && currentY === initialY) return;

        const onTransitionEnd = () => {
          containerStyle.transition = "none";
          updateDimensions();
          container.removeEventListener("transitionend", onTransitionEnd);
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        };

        container.addEventListener("transitionend", onTransitionEnd);
        containerStyle.transition =
          "transform 0.25s cubic-bezier(0, 0, 0.2, 1)";

        requestAnimationFrame(() => {
          containerStyle.transform = `translate3d(${snappedPosition.x}px, ${snappedPosition.y}px, 0)`;
        });

        signalWidget.value = {
          corner: newCorner,
          dimensions: {
            isFullWidth: dimensions.isFullWidth,
            isFullHeight: dimensions.isFullHeight,
            width: dimensions.width,
            height: dimensions.height,
            position: snappedPosition,
          },
          lastDimensions: signalWidget.value.lastDimensions,
          componentsTree: signalWidget.value.componentsTree,
        };

        saveLocalStorage(LOCALSTORAGE_KEY, {
          corner: newCorner,
          dimensions: signalWidget.value.dimensions,
          lastDimensions: signalWidget.value.lastDimensions,
          componentsTree: signalWidget.value.componentsTree,
        });
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerEnd);
    },
    []
  );

  const handleCollapsedDrag = useCallback(
    (e: JSX.TargetedPointerEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!refWidget.current || !signalWidgetCollapsed.value) return;

      const { corner: collapsedCorner, orientation = "horizontal" } =
        signalWidgetCollapsed.value;

      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;

      let rafId: number | null = null;
      let hasExpanded = false;

      const DRAG_THRESHOLD = 50;

      const handlePointerMove = (e: globalThis.PointerEvent) => {
        if (hasExpanded || rafId) return;

        const deltaX = e.clientX - initialMouseX;
        const deltaY = e.clientY - initialMouseY;

        let shouldExpand = false;

        if (orientation === "horizontal") {
          if (collapsedCorner.endsWith("left") && deltaX > DRAG_THRESHOLD) {
            shouldExpand = true;
          } else if (
            collapsedCorner.endsWith("right") &&
            deltaX < -DRAG_THRESHOLD
          ) {
            shouldExpand = true;
          }
        } else {
          if (collapsedCorner.startsWith("top") && deltaY > DRAG_THRESHOLD) {
            shouldExpand = true;
          } else if (
            collapsedCorner.startsWith("bottom") &&
            deltaY < -DRAG_THRESHOLD
          ) {
            shouldExpand = true;
          }
        }

        if (shouldExpand) {
          hasExpanded = true;

          signalWidgetCollapsed.value = null;
          saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, null);

          if (refInitialMinimizedWidth.current === 0 && refWidget.current) {
            requestAnimationFrame(() => {
              if (refWidget.current) {
                refWidget.current.style.width = "min-content";
                const naturalWidth = refWidget.current.offsetWidth;
                refInitialMinimizedWidth.current = naturalWidth || 300;

                const lastDims = signalWidget.value.lastDimensions;
                const targetWidth = calculateBoundedSize(
                  lastDims.width,
                  0,
                  true
                );
                const targetHeight = calculateBoundedSize(
                  lastDims.height,
                  0,
                  false
                );

                let newX = e.clientX - targetWidth / 2;
                let newY = e.clientY - targetHeight / 2;

                newX = Math.max(
                  SAFE_AREA,
                  Math.min(newX, window.innerWidth - targetWidth - SAFE_AREA)
                );
                newY = Math.max(
                  SAFE_AREA,
                  Math.min(newY, window.innerHeight - targetHeight - SAFE_AREA)
                );

                signalWidget.value = {
                  ...signalWidget.value,
                  dimensions: {
                    ...signalWidget.value.dimensions,
                    position: { x: newX, y: newY },
                  },
                };

                updateWidgetPosition(true);

                const savedView = readLocalStorage<WidgetStates>(
                  LOCALSTORAGE_LAST_VIEW_KEY
                );
                signalWidgetViews.value = savedView || { view: "none" };

                setTimeout(() => {
                  if (refWidget.current) {
                    const dragEvent = new PointerEvent("pointerdown", {
                      clientX: e.clientX,
                      clientY: e.clientY,
                      pointerId: e.pointerId,
                      bubbles: true,
                    });
                    refWidget.current.dispatchEvent(dragEvent);
                  }
                }, 100);
              }
            });
          } else {
            updateWidgetPosition(true);
            const savedView = readLocalStorage<WidgetStates>(
              LOCALSTORAGE_LAST_VIEW_KEY
            );
            signalWidgetViews.value = savedView || { view: "none" };
          }

          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerEnd);
        }
      };

      const handlePointerEnd = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerEnd);
    },
    []
  );

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!refWidget.current) return;

    removeLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY);

    if (!signalWidgetCollapsed.value) {
      refWidget.current.style.width = "min-content";
      refInitialMinimizedHeight.current = 36; // height of the header
      refInitialMinimizedWidth.current = refWidget.current.offsetWidth;
    } else {
      refInitialMinimizedHeight.current = 36;
      refInitialMinimizedWidth.current = 0;
    }

    refWidget.current.style.maxWidth = `calc(100vw - ${SAFE_AREA * 2}px)`;
    refWidget.current.style.maxHeight = `calc(100vh - ${SAFE_AREA * 2}px)`;

    updateWidgetPosition();

    if (
      Store.inspectState.value.kind !== "focused" &&
      !signalWidgetCollapsed.value &&
      !refExpandingFromCollapsed.current
    ) {
      signalWidget.value = {
        ...signalWidget.value,
        dimensions: {
          isFullWidth: false,
          isFullHeight: false,
          width: refInitialMinimizedWidth.current,
          height: refInitialMinimizedHeight.current,
          position: signalWidget.value.dimensions.position,
        },
      };
    }

    signalRefWidget.value = refWidget.current;

    const unsubscribeSignalWidget = signalWidget.subscribe((widget) => {
      if (!refWidget.current) return;

      const { x, y } = widget.dimensions.position;
      const { width, height } = widget.dimensions;
      const container = refWidget.current;

      requestAnimationFrame(() => {
        container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
      });
    });

    const unsubscribeSignalWidgetViews = signalWidgetViews.subscribe(
      (state) => {
        refShouldOpen.current = state.view !== "none";
        updateWidgetPosition();

        if (!signalWidgetCollapsed.value) {
          if (state.view !== "none") {
            saveLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY, state);
          } else {
            removeLocalStorage(LOCALSTORAGE_LAST_VIEW_KEY);
          }
        }
      }
    );

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(
      (state) => {
        refShouldOpen.current = state.kind === "focused";
        updateWidgetPosition();
      }
    );

    const handleWindowResize = () => {
      updateWidgetPosition(true);
    };

    window.addEventListener("resize", handleWindowResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      unsubscribeSignalWidgetViews();
      unsubscribeStoreInspectState();
      unsubscribeSignalWidget();

      saveLocalStorage(LOCALSTORAGE_KEY, {
        ...defaultWidgetConfig,
        corner: signalWidget.value.corner,
      });
    };
  }, []);

  // i don't want to put the ref in state, so this is the solution to force context to propagate it
  const [_, setTriggerRender] = useState(false);
  useEffect(() => {
    setTriggerRender(true);
  }, []);

  const isCollapsed = signalWidgetCollapsed.value;

  let arrowRotationClass = "";
  if (isCollapsed) {
    const { orientation = "horizontal", corner } = isCollapsed;
    if (orientation === "horizontal") {
      arrowRotationClass = corner?.endsWith("right") ? "rotate-180" : "";
    } else {
      arrowRotationClass = corner?.startsWith("bottom")
        ? "-rotate-90"
        : "rotate-90";
    }
  }

  return (
    <>
      <ScanOverlay />
      <ToolbarElementContext.Provider value={refWidget.current}>
        <div
          id="react-scan-toolbar"
          dir="ltr"
          ref={refWidget}
          onPointerDown={!isCollapsed ? handleDrag : handleCollapsedDrag}
          className={cn(
            "fixed inset-0",
            isCollapsed
              ? (() => {
                  const { orientation = "horizontal", corner } = isCollapsed;
                  if (orientation === "horizontal") {
                    return corner?.endsWith("right")
                      ? "rounded-tl-lg rounded-bl-lg shadow-lg"
                      : "rounded-tr-lg rounded-br-lg shadow-lg";
                  } else {
                    return corner?.startsWith("bottom")
                      ? "rounded-tl-lg rounded-tr-lg shadow-lg"
                      : "rounded-bl-lg rounded-br-lg shadow-lg";
                  }
                })()
              : "rounded-lg shadow-lg",
            "flex flex-col",
            "font-mono text-[13px]",
            "user-select-none",
            "opacity-0",
            isCollapsed ? "cursor-pointer" : "cursor-move",
            "z-[124124124124]",
            "animate-fade-in animation-duration-300 animation-delay-300",
            "will-change-transform",
            "[touch-action:none]"
          )}
          style={{ WebkitAppRegion: "no-drag" }}
        >
          {/* this entire feature is vibe coded don't think too hard about the code its probably very non coherent */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => {
                signalWidgetCollapsed.value = null;
                saveLocalStorage(LOCALSTORAGE_COLLAPSED_KEY, null);

                if (
                  refInitialMinimizedWidth.current === 0 &&
                  refWidget.current
                ) {
                  requestAnimationFrame(() => {
                    if (refWidget.current) {
                      refWidget.current.style.width = "min-content";
                      const naturalWidth = refWidget.current.offsetWidth;
                      refInitialMinimizedWidth.current = naturalWidth || 300;
                      updateWidgetPosition(true);
                    }
                  });
                }

                const savedView = readLocalStorage<WidgetStates>(
                  LOCALSTORAGE_LAST_VIEW_KEY
                );
                signalWidgetViews.value = savedView || { view: "none" };
              }}
              className="flex items-center justify-center w-full h-full text-white"
              title="Expand toolbar"
            >
              <Icon
                name="icon-chevron-right"
                size={16}
                className={cn("transition-transform", arrowRotationClass)}
              />
            </button>
          ) : (
            <>
              <ResizeHandle position="top" />
              <ResizeHandle position="bottom" />
              <ResizeHandle position="left" />
              <ResizeHandle position="right" />
              <Content />
            </>
          )}
        </div>
      </ToolbarElementContext.Provider>
    </>
  );
};

export const ToolbarElementContext = createContext<HTMLElement | null>(null);
