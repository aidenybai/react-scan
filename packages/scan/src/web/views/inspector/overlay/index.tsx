import { type Fiber, getDisplayName } from "bippy";
import { createEffect, on, onCleanup, onMount } from "solid-js";
import {
  getInspectState,
  getLastReportTime,
  getOptionsState,
  setInspectState,
} from "../../../../core/native-state";
import type { States } from "../../../../core/inspection/types";
import { IS_CLIENT } from "../../../../utils/is-client";

import { setWidgetView } from "../../../state";
import { cn, throttle } from "../../../utils/helpers";
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
import {
  findComponentDOMNode,
  getAssociatedFiberRect,
  getCompositeComponentFromElement,
  nonVisualTags,
} from "../utils";

type DrawKind = "locked" | "inspecting";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LockIconRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ANIMATION_CONFIG = {
  frameInterval: 1000 / 60,
  speeds: {
    fast: 0.51,
    slow: 0.1,
    off: 0,
  },
} as const;

const OVERLAY_DPR = IS_CLIENT ? /* @__PURE__ */ window.devicePixelRatio || 1 : 1;

export const ScanOverlay = () => {
  let canvasElement: HTMLCanvasElement | undefined;
  let eventCatcherElement: HTMLDivElement | undefined;
  let currentRect: Rect | null = null;
  let currentLockIconRect: LockIconRect | null = null;
  let lastHoveredElement: Element | null = null;
  let animationFrameId = 0;
  let timeout: TTimer | undefined;
  const cleanupMap = new Map<States["kind"] | "fade-out", () => void>();
  let isFadingOut = false;
  let lastFrameTime = 0;

  const drawLockIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineWidth = 1.5;

    const shackleWidth = size * 0.6;
    const shackleHeight = size * 0.5;
    const shackleX = x + (size - shackleWidth) / 2;
    const shackleY = y;

    ctx.beginPath();
    ctx.arc(
      shackleX + shackleWidth / 2,
      shackleY + shackleHeight / 2,
      shackleWidth / 2,
      Math.PI,
      0,
      false,
    );
    ctx.stroke();

    const bodyWidth = size * 0.8;
    const bodyHeight = size * 0.5;
    const bodyX = x + (size - bodyWidth) / 2;
    const bodyY = y + shackleHeight / 2;

    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.restore();
  };

  const drawStatsPill = (
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    kind: "locked" | "inspecting",
    fiber: Fiber | null,
  ) => {
    if (!fiber) return;

    const pillHeight = 24;
    const pillPadding = 8;
    const componentName = (fiber?.type && getDisplayName(fiber.type)) ?? "Unknown";
    const text = componentName;

    ctx.save();
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const lockIconSize = kind === "locked" ? 14 : 0;
    const lockIconPadding = kind === "locked" ? 6 : 0;
    const pillWidth = textWidth + pillPadding * 2 + lockIconSize + lockIconPadding;

    const pillX = rect.left;
    const pillY = rect.top - pillHeight - 4;

    ctx.fillStyle = "rgb(37, 37, 38, .75)";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
    ctx.fill();

    if (kind === "locked") {
      const lockX = pillX + pillPadding;
      const lockY = pillY + (pillHeight - lockIconSize) / 2 + 2;
      drawLockIcon(ctx, lockX, lockY, lockIconSize);
      currentLockIconRect = {
        x: lockX,
        y: lockY,
        width: lockIconSize,
        height: lockIconSize,
      };
    } else {
      currentLockIconRect = null;
    }

    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    const textX = pillX + pillPadding + (kind === "locked" ? lockIconSize + lockIconPadding : 0);
    ctx.fillText(text, textX, pillY + pillHeight / 2);
    ctx.restore();
  };

  const drawRect = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    kind: DrawKind,
    fiber: Fiber | null,
  ) => {
    if (!currentRect) return;
    const rect = currentRect;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(142, 97, 227, 0.5)";
    ctx.fillStyle = "rgba(173, 97, 230, 0.10)";

    if (kind === "locked") {
      ctx.setLineDash([]);
    } else {
      ctx.setLineDash([4]);
    }

    ctx.lineWidth = 1;
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    drawStatsPill(ctx, rect, kind, fiber);
  };

  const animate = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    targetRect: Rect,
    kind: DrawKind,
    parentCompositeFiber: Fiber,
    onComplete?: () => void,
  ) => {
    const speed = getOptionsState().animationSpeed as keyof typeof ANIMATION_CONFIG.speeds;
    const t = ANIMATION_CONFIG.speeds[speed] ?? ANIMATION_CONFIG.speeds.off;

    const animationFrame = (timestamp: number) => {
      if (timestamp - lastFrameTime < ANIMATION_CONFIG.frameInterval) {
        animationFrameId = requestAnimationFrame(animationFrame);
        return;
      }
      lastFrameTime = timestamp;

      if (!currentRect) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      currentRect = {
        left: lerp(currentRect.left, targetRect.left, t),
        top: lerp(currentRect.top, targetRect.top, t),
        width: lerp(currentRect.width, targetRect.width, t),
        height: lerp(currentRect.height, targetRect.height, t),
      };

      drawRect(canvas, ctx, kind, parentCompositeFiber);

      const stillMoving =
        Math.abs(currentRect.left - targetRect.left) > 0.1 ||
        Math.abs(currentRect.top - targetRect.top) > 0.1 ||
        Math.abs(currentRect.width - targetRect.width) > 0.1 ||
        Math.abs(currentRect.height - targetRect.height) > 0.1;

      if (stillMoving) {
        animationFrameId = requestAnimationFrame(animationFrame);
      } else {
        currentRect = targetRect;
        drawRect(canvas, ctx, kind, parentCompositeFiber);
        cancelAnimationFrame(animationFrameId);
        ctx.restore();
        onComplete?.();
      }
    };

    cancelAnimationFrame(animationFrameId);
    clearTimeout(timeout);

    animationFrameId = requestAnimationFrame(animationFrame);

    timeout = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      currentRect = targetRect;
      drawRect(canvas, ctx, kind, parentCompositeFiber);
      ctx.restore();
      onComplete?.();
    }, 1000);
  };

  const setupOverlayAnimation = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    targetRect: Rect,
    kind: DrawKind,
    parentCompositeFiber: Fiber,
  ) => {
    ctx.save();

    if (!currentRect) {
      currentRect = targetRect;
      drawRect(canvas, ctx, kind, parentCompositeFiber);
      ctx.restore();
      return;
    }

    animate(canvas, ctx, targetRect, kind, parentCompositeFiber);
  };

  const drawHoverOverlay = async (
    overlayElement: Element | null,
    canvas: HTMLCanvasElement | null,
    ctx: CanvasRenderingContext2D | null,
    kind: DrawKind,
  ) => {
    if (!overlayElement || !canvas || !ctx) return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(overlayElement);
    const targetRect = await getAssociatedFiberRect(overlayElement);

    if (!parentCompositeFiber || !targetRect) return;

    setupOverlayAnimation(canvas, ctx, targetRect, kind, parentCompositeFiber);
  };

  const unsubscribeAll = () => {
    for (const cleanup of cleanupMap.values()) {
      cleanup?.();
    }
  };

  const cleanupCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    currentRect = null;
    currentLockIconRect = null;
    lastHoveredElement = null;
    canvas.classList.remove("fade-in");
    isFadingOut = false;
  };

  const startFadeOut = (onComplete?: () => void) => {
    if (!canvasElement || isFadingOut) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (!canvasElement || e.propertyName !== "opacity" || !isFadingOut) {
        return;
      }
      canvasElement.removeEventListener("transitionend", handleTransitionEnd);
      cleanupCanvas(canvasElement);
      onComplete?.();
    };
    const existingListener = cleanupMap.get("fade-out");
    if (existingListener) {
      existingListener();
      cleanupMap.delete("fade-out");
    }

    canvasElement.addEventListener("transitionend", handleTransitionEnd);
    cleanupMap.set("fade-out", () => {
      canvasElement?.removeEventListener("transitionend", handleTransitionEnd);
    });

    isFadingOut = true;
    canvasElement.classList.remove("fade-in");
    requestAnimationFrame(() => {
      canvasElement?.classList.add("fade-out");
    });
  };

  const startFadeIn = () => {
    if (!canvasElement) return;
    isFadingOut = false;
    canvasElement.classList.remove("fade-out");
    requestAnimationFrame(() => {
      canvasElement?.classList.add("fade-in");
    });
  };

  const handleHoverableElement = (componentElement: Element) => {
    if (componentElement === lastHoveredElement) return;

    lastHoveredElement = componentElement;

    if (nonVisualTags.has(componentElement.tagName)) {
      startFadeOut();
    } else {
      startFadeIn();
    }

    setInspectState({
      kind: "inspecting",
      hoveredDomElement: componentElement,
    });
  };

  const handleNonHoverableArea = () => {
    if (!currentRect || !canvasElement || isFadingOut) {
      return;
    }

    startFadeOut();
  };

  const handlePointerMove = throttle((e?: PointerEvent) => {
    const state = getInspectState();
    if (state.kind !== "inspecting" || !eventCatcherElement) return;

    eventCatcherElement.style.pointerEvents = "none";
    const element = document.elementFromPoint(e?.clientX ?? 0, e?.clientY ?? 0);

    eventCatcherElement.style.removeProperty("pointer-events");

    clearTimeout(timeout);

    if (element && element !== canvasElement) {
      const { parentCompositeFiber } = getCompositeComponentFromElement(element as Element);
      if (parentCompositeFiber) {
        const componentElement = findComponentDOMNode(parentCompositeFiber);
        if (componentElement) {
          handleHoverableElement(componentElement);
          return;
        }
      }
    }

    handleNonHoverableArea();
  }, 32);

  const isClickInLockIcon = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const lockIconRect = currentLockIconRect;
    if (!lockIconRect) return false;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const adjustedX = x / OVERLAY_DPR;
    const adjustedY = y / OVERLAY_DPR;

    return (
      adjustedX >= lockIconRect.x &&
      adjustedX <= lockIconRect.x + lockIconRect.width &&
      adjustedY >= lockIconRect.y &&
      adjustedY <= lockIconRect.y + lockIconRect.height
    );
  };

  const handleLockIconClick = (state: States) => {
    if (state.kind === "focused") {
      setInspectState({
        kind: "inspecting",
        hoveredDomElement: state.focusedDomElement,
      });
    }
  };

  const handleElementClick = (e: MouseEvent) => {
    const clickableElements = ["react-scan-inspect-element", "react-scan-power"];
    // avoid capturing the synthetic event sent back to the toolbar, we don't want to block click events on it ever
    if (e.target instanceof HTMLElement && clickableElements.includes(e.target.id)) {
      return;
    }

    const tagName = lastHoveredElement?.tagName;
    if (tagName && nonVisualTags.has(tagName)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const element = lastHoveredElement ?? document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;

    const clickedEl = e.composedPath().at(0);

    if (clickedEl instanceof HTMLElement && clickableElements.includes(clickedEl.id)) {
      const syntheticEvent = Object.assign(new MouseEvent(e.type, e), {
        __reactScanSyntheticEvent: true,
      });
      clickedEl.dispatchEvent(syntheticEvent);
      return;
    }
    const { parentCompositeFiber } = getCompositeComponentFromElement(element as Element);
    if (!parentCompositeFiber) return;

    const componentElement = findComponentDOMNode(parentCompositeFiber);

    if (!componentElement) {
      lastHoveredElement = null;
      setInspectState({
        kind: "inspect-off",
      });
      return;
    }

    setInspectState({
      kind: "focused",
      focusedDomElement: componentElement,
      fiber: parentCompositeFiber,
    });
  };

  const handleClick = (e: MouseEvent) => {
    if ("__reactScanSyntheticEvent" in e && e.__reactScanSyntheticEvent === true) {
      return;
    }

    const state = getInspectState();
    const canvas = canvasElement;
    if (!canvas || !eventCatcherElement) return;

    if (isClickInLockIcon(e, canvas)) {
      e.preventDefault();
      e.stopPropagation();
      handleLockIconClick(state);
      return;
    }

    if (state.kind === "inspecting") {
      handleElementClick(e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;

    const state = getInspectState();
    const canvas = canvasElement;
    if (!canvas) return;

    if (document.activeElement?.id === "react-scan-root") {
      return;
    }

    setWidgetView({
      view: "none",
    });

    if (state.kind === "focused" || state.kind === "inspecting") {
      e.preventDefault();
      e.stopPropagation();

      switch (state.kind) {
        case "focused": {
          startFadeIn();
          currentRect = null;
          lastHoveredElement = state.focusedDomElement;
          setInspectState({
            kind: "inspecting",
            hoveredDomElement: state.focusedDomElement,
          });
          break;
        }
        case "inspecting": {
          startFadeOut(() => {
            setInspectState({
              kind: "inspect-off",
            });
          });
          break;
        }
      }
    }
  };

  const handleStateChange = (
    state: States,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    cleanupMap.get(state.kind)?.();

    if (eventCatcherElement) {
      if (state.kind !== "inspecting") {
        eventCatcherElement.style.pointerEvents = "none";
      }
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    switch (state.kind) {
      case "inspect-off":
        startFadeOut();
        return;

      case "inspecting":
        drawHoverOverlay(state.hoveredDomElement, canvas, ctx, "inspecting");
        break;

      case "focused":
        if (!state.focusedDomElement) return;

        if (lastHoveredElement !== state.focusedDomElement) {
          lastHoveredElement = state.focusedDomElement;
        }

        setWidgetView({
          view: "inspector",
        });

        drawHoverOverlay(state.focusedDomElement, canvas, ctx, "locked");
        break;
    }
  };

  const updateCanvasSize = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * OVERLAY_DPR;
    canvas.height = rect.height * OVERLAY_DPR;
    ctx.scale(OVERLAY_DPR, OVERLAY_DPR);
    ctx.save();
  };

  const handleResizeOrScroll = () => {
    const state = getInspectState();
    const canvas = canvasElement;
    if (!canvas) return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    cancelAnimationFrame(animationFrameId);
    clearTimeout(timeout);

    updateCanvasSize(canvas, ctx);
    currentRect = null;

    if (state.kind === "focused" && state.focusedDomElement) {
      drawHoverOverlay(state.focusedDomElement, canvas, ctx, "locked");
    } else if (state.kind === "inspecting" && state.hoveredDomElement) {
      drawHoverOverlay(state.hoveredDomElement, canvas, ctx, "inspecting");
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    const state = getInspectState();
    const canvas = canvasElement;
    if (!canvas) return;

    if (state.kind === "inspecting" || isClickInLockIcon(e as unknown as MouseEvent, canvas)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  onMount(() => {
    const canvas = canvasElement;
    if (!canvas) return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    updateCanvasSize(canvas, ctx);

    createEffect(
      on(
        getInspectState,
        (state) => {
          handleStateChange(state, canvas, ctx);
        },
        { defer: true },
      ),
    );

    createEffect(
      on(
        getLastReportTime,
        () => {
          const state = getInspectState();
          if (state.kind !== "focused" || !animationFrameId || !currentRect) return;
          const { parentCompositeFiber } = getCompositeComponentFromElement(
            state.focusedDomElement,
          );
          if (parentCompositeFiber) {
            drawHoverOverlay(state.focusedDomElement, canvas, ctx, "locked");
          }
        },
        { defer: true },
      ),
    );

    window.addEventListener("scroll", handleResizeOrScroll, { passive: true });
    window.addEventListener("resize", handleResizeOrScroll, { passive: true });
    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
      capture: true,
    });
    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    onCleanup(() => {
      unsubscribeAll();
      window.removeEventListener("scroll", handleResizeOrScroll);
      window.removeEventListener("resize", handleResizeOrScroll);
      document.removeEventListener("pointermove", handlePointerMove, {
        capture: true,
      });
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(timeout);
    });
  });

  return (
    <>
      <div
        ref={eventCatcherElement}
        class={cn("fixed top-0 left-0 w-screen h-screen", "z-[214748365]")}
        // DO NOT DO NOT DO NOT REMOVE THE STYLE IT WILL CAUSE MASSIVE PERFORMANCE ISSUES https://x.com/RobKnight__/status/1897524145157439558
        style={{
          "pointer-events": "none",
        }}
      />
      <canvas
        ref={canvasElement}
        dir="ltr"
        class={cn(
          "react-scan-inspector-overlay",
          "fixed top-0 left-0 w-screen h-screen",
          "pointer-events-none",
          "z-[214748367]",
        )}
      />
    </>
  );
};
