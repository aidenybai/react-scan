import { didFiberRender } from 'bippy';
import { Store } from '../../index';
import { throttle } from '../utils/helpers';
import {
  OVERLAY_DPR,
  currentLockIconRect,
  drawHoverOverlay,
  updateCanvasSize,
} from './overlay';
import { getCompositeComponentFromElement } from './utils';
import { renderPropsAndState } from './view-state';

export type States =
  | {
      kind: 'inspecting';
      hoveredDomElement: HTMLElement | null;
      propContainer: HTMLDivElement;
    }
  | {
      kind: 'inspect-off';
      propContainer: HTMLDivElement;
    }
  | {
      kind: 'focused';
      focusedDomElement: HTMLElement;
      propContainer: HTMLDivElement;
    }
  | {
      kind: 'uninitialized';
      propContainer?: HTMLDivElement;
    };

const INSPECT_OVERLAY_CANVAS_ID = 'react-scan-inspect-canvas';
let lastHoveredElement: HTMLElement;
let animationId: ReturnType<typeof requestAnimationFrame>;

type Kinds = States['kind'];

export const createInspectElementStateMachine = (shadow: ShadowRoot) => {
  if (typeof window === 'undefined') {
    return;
  }

  let canvas = document.getElementById(
    INSPECT_OVERLAY_CANVAS_ID,
  ) as HTMLCanvasElement | null;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = INSPECT_OVERLAY_CANVAS_ID;
    canvas.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 214748367;
  `;
    shadow.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return;
    }
    updateCanvasSize(canvas, ctx);
    window.addEventListener(
      'resize',
      () => {
        updateCanvasSize(canvas!, ctx);
      },
      { capture: true },
    ); // todo add cleanup/dispose logic for createInspectElementStateMachine
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    // 2d context not available, just bail
    return;
  }

  const clearCanvas = () => {
    cancelAnimationFrame(animationId);
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  };
  const unsubscribeFns: Partial<{ [_ in keyof States as Kinds]: () => void }> =
    {
      // Needs to be initialized already so that we don't shift V8 states
      focused: undefined,
      'inspect-off': undefined,
      inspecting: undefined,
      uninitialized: undefined,
    };

  const unsubscribeAll = () => {
    for (const key in unsubscribeFns) {
      unsubscribeFns[key as Kinds]?.();
    }
  };

  const recursiveRaf = (cb: () => void) => {
    const helper = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      animationId = requestAnimationFrame(() => {
        cb();
        helper();
      });
    };
    helper();
  };

  window.addEventListener(
    'mousemove',
    () => {
      if (Store.inspectState.value.kind !== 'inspect-off') {
        return;
      }
      // the canvas doesn't get cleared when the mouse move overlaps with the clear
      // i can't figure out why this happens, so this is an unfortunate hack
      clearCanvas();
      updateCanvasSize(canvas, ctx);
    },
    { capture: true },
  );
  let previousState: typeof Store.inspectState.value.kind;

  const repaint = throttle(() => {
    // todo: make inspect-off state act as 0 perf hit since it does nothing
    const unSub = (() => {
      const inspectState = Store.inspectState.value;
      switch (inspectState.kind) {
        case 'uninitialized': {
          return;
        }
        case 'inspect-off': {
          if (previousState !== 'inspect-off') {
            // likely because of weird RAF timing
            // todo: figure out why this is needed
            // to see the bug without setTimeout:
            // - inspect something
            // - focus something
            // - turn off inspection
            // - focus drawing still exists
            setTimeout(() => {
              cancelAnimationFrame(animationId);
              unsubscribeAll();
              clearCanvas();
            }, 100);
          }
          clearCanvas(); // todo: make sure this isn't expensive
          return;
        }
        case 'inspecting': {
          unsubscribeAll();
          recursiveRaf(() => {
            if (!inspectState.hoveredDomElement) {
              return;
            }
            drawHoverOverlay(
              inspectState.hoveredDomElement,
              canvas,
              ctx,
              'inspecting',
            );
          });
          // we want to allow the user to be able to inspect pointerdownable things
          const eventCatcher = document.createElement('div');
          eventCatcher.style.cssText = `
              position: fixed;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh;
              z-index: ${parseInt(canvas.style.zIndex) - 1};
              pointer-events: auto;
            `;

          canvas.parentNode!.insertBefore(eventCatcher, canvas);
          let currentHoveredElement: HTMLElement | null = null;
          const mouseMove = throttle((e: MouseEvent) => {
            if (Store.inspectState.value.kind !== 'inspecting') {
              return;
            }

            // temp hide event catcher to get real target
            eventCatcher.style.pointerEvents = 'none';
            const el = document.elementFromPoint(
              e.clientX,
              e.clientY,
            ) as HTMLElement;
            eventCatcher.style.pointerEvents = 'auto';

            if (!el) return;
            lastHoveredElement = el;

            currentHoveredElement = el;
            inspectState.hoveredDomElement = el;
            drawHoverOverlay(el, canvas, ctx, 'inspecting');
          }, 16);

          window.addEventListener('mousemove', mouseMove, { capture: true });

          const pointerdown = (e: MouseEvent) => {
            e.stopPropagation();

            eventCatcher.style.pointerEvents = 'none';
            const el =
              currentHoveredElement ??
              document.elementFromPoint(e.clientX, e.clientY) ??
              lastHoveredElement;
            eventCatcher.style.pointerEvents = 'auto';

            if (!el) {
              return;
            }

            drawHoverOverlay(el as HTMLElement, canvas, ctx, 'locked');

            Store.inspectState.value = {
              kind: 'focused',
              focusedDomElement: el as HTMLElement,
              propContainer: inspectState.propContainer,
            };
          };
          window.addEventListener('pointerdown', pointerdown, {
            capture: true,
          });

          const keyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              Store.inspectState.value = {
                kind: 'inspect-off',
                propContainer: inspectState.propContainer,
              };
              clearCanvas();
            }
          };
          window.addEventListener('keydown', keyDown, { capture: true });
          let cleanup = () => {
            /**/
          };
          if (inspectState.hoveredDomElement) {
            cleanup = trackElementPosition(
              inspectState.hoveredDomElement,
              () => {
                drawHoverOverlay(
                  inspectState.hoveredDomElement,
                  canvas,
                  ctx,
                  'inspecting',
                );
              },
            );
          }

          return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('pointerdown', pointerdown, {
              capture: true,
            });
            window.removeEventListener('mousemove', mouseMove, {
              capture: true,
            });
            window.removeEventListener('keydown', keyDown, { capture: true });
            eventCatcher.parentNode?.removeChild(eventCatcher);
            cleanup();
          };
        }
        case 'focused': {
          unsubscribeAll(); // potential optimization: only unSub if inspectStateKind transitioned
          recursiveRaf(() => {
            drawHoverOverlay(
              inspectState.focusedDomElement,
              canvas,
              ctx,
              'locked',
            );
          });
          if (!document.contains(inspectState.focusedDomElement)) {
            setTimeout(() => {
              // potential race condition solution for some websites
              clearCanvas();
            }, 500);

            Store.inspectState.value = {
              kind: 'inspect-off',
              propContainer: inspectState.propContainer,
            };
            return;
          }
          drawHoverOverlay(
            inspectState.focusedDomElement,
            canvas,
            ctx,
            'locked',
          );

          const element = inspectState.focusedDomElement;

          const { parentCompositeFiber } =
            getCompositeComponentFromElement(element);

          if (!parentCompositeFiber) {
            return;
          }

          const didRender = didFiberRender(parentCompositeFiber); // because we react to any change, not just this fibers change, we need this check to know if the current fiber re-rendered for this publish

          renderPropsAndState(didRender, parentCompositeFiber);

          const keyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              clearCanvas();
              drawHoverOverlay(
                (e.target as HTMLElement) ?? inspectState.focusedDomElement,
                canvas,
                ctx,
                'inspecting',
              );

              // inspectState.propContainer.innerHTML = '';
              Store.inspectState.value = {
                kind: 'inspecting',
                hoveredDomElement:
                  (e.target as HTMLElement) ?? inspectState.focusedDomElement,
                propContainer: inspectState.propContainer,
              };
            }
          };
          window.addEventListener('keydown', keyDown, { capture: true });

          const onpointerdownCanvasLockIcon = (e: MouseEvent) => {
            if (!currentLockIconRect) {
              return;
            }

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const adjustedX = x / OVERLAY_DPR;
            const adjustedY = y / OVERLAY_DPR;

            if (
              adjustedX >= currentLockIconRect.x &&
              adjustedX <= currentLockIconRect.x + currentLockIconRect.width &&
              adjustedY >= currentLockIconRect.y &&
              adjustedY <= currentLockIconRect.y + currentLockIconRect.height
            ) {
              inspectState.propContainer.innerHTML = '';
              clearCanvas();

              drawHoverOverlay(
                e.target as HTMLElement,
                canvas,
                ctx,
                'inspecting',
              );
              e.stopPropagation();
              Store.inspectState.value = {
                kind: 'inspecting',
                hoveredDomElement: e.target as HTMLElement,
                propContainer: inspectState.propContainer,
              };

              return;
            }
          };

          window.addEventListener('pointerdown', onpointerdownCanvasLockIcon, {
            capture: true,
          });

          const cleanup = trackElementPosition(
            inspectState.focusedDomElement,
            () => {
              drawHoverOverlay(
                inspectState.focusedDomElement,
                canvas,
                ctx,
                'locked',
              );
            },
          );

          return () => {
            cleanup();

            cancelAnimationFrame(animationId);

            window.removeEventListener('keydown', keyDown, { capture: true });
            window.removeEventListener(
              'pointerdown',
              onpointerdownCanvasLockIcon,
              { capture: true },
            );
          };
        }
      }
    })();

    if (unSub) {
      (unsubscribeFns as any)[Store.inspectState.value.kind] = unSub;
    }
    previousState = Store.inspectState.value.kind;
  }, 70);

  Store.inspectState.subscribe(repaint);
  Store.lastReportTime.subscribe(repaint);

  return () => {
    /**/
  };
};
type CleanupFunction = () => void;
type PositionCallback = (element: Element) => void;

const trackElementPosition = (
  element: Element,
  callback: PositionCallback,
): CleanupFunction => {
  const handleAnyScroll = () => {
    callback(element);
  };

  document.addEventListener('scroll', handleAnyScroll, {
    passive: true,
    capture: true, // catch all scroll events
  });

  return () => {
    document.removeEventListener('scroll', handleAnyScroll, { capture: true });
  };
};
