import { type Internals, ReactScanInternals } from '../../index';
import { throttle } from '../utils';
import { didFiberRender } from '../../instrumentation/fiber';
import { restoreSizeFromLocalStorage } from '../toolbar';
import { renderPropsAndState } from './view-state';
import {
  currentLockIconRect,
  drawHoverOverlay,
  OVERLAY_DPR,
  updateCanvasSize,
} from './overlay';
import { getCompositeComponentFromElement, hasValidParent } from './utils';

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
    };

export const INSPECT_TOGGLE_ID = 'react-scan-inspect-element-toggle';
export const INSPECT_OVERLAY_CANVAS_ID = 'react-scan-inspect-canvas';
let animationId: ReturnType<typeof requestAnimationFrame>;

type Kinds = States['kind'];
export const createInspectElementStateMachine = () => {
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
    document.documentElement.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return;
    }
    updateCanvasSize(canvas, ctx);
    window.addEventListener('resize', () => {
      updateCanvasSize(canvas!, ctx);
    }); // todo add cleanup/dispose logic for createInspectElementStateMachine
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
    {};

  const unsubscribeAll = () => {
    Object.entries(unsubscribeFns).forEach(([_, unSub]) => {
      unSub();
    });
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
  ReactScanInternals.subscribeMultiple(
    ['reportDataByFiber', 'inspectState'],
    throttle((store: Internals) => {
      unsubscribeAll(); // potential optimization: only unSub if inspectStateKind transitioned
      const unSub = (() => {
        const inspectState = store.inspectState;
        switch (inspectState.kind) {
          case 'uninitialized': {
            return;
          }
          case 'inspect-off': {
            clearCanvas();
            // the canvas doesn't get cleared when the mouse move overlaps with the clear
            // i can't figure out why this happens, so this is an unfortunate hack
            const mouseMove = () => {
              clearCanvas();
              updateCanvasSize(canvas, ctx);
            };
            window.addEventListener('mousemove', mouseMove);

            return () => {
              window.removeEventListener('mousemove', mouseMove);
            };
          }
          case 'inspecting': {
            let lastBoundingRect: DOMRect | null = null;

            const updateOverlay = (element: HTMLElement, type: 'inspecting' | 'locked') => {
              const newBoundingRect = element.getBoundingClientRect();

              if (lastBoundingRect &&
                lastBoundingRect.top === newBoundingRect.top &&
                lastBoundingRect.left === newBoundingRect.left &&
                lastBoundingRect.width === newBoundingRect.width &&
                lastBoundingRect.height === newBoundingRect.height) {
                return;
              }

              lastBoundingRect = newBoundingRect;
              drawHoverOverlay(
                element,
                canvas,
                ctx,
                type,
              );
            };

            recursiveRaf(() => {
              if (!inspectState.hoveredDomElement) {
                return;
              }
              updateOverlay(inspectState.hoveredDomElement, 'inspecting');
            });

            // we want to allow the user to be able to inspect clickable things
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

            document.body.insertBefore(eventCatcher, document.body.firstChild);

            const mouseMove = throttle((e: MouseEvent) => {
              if (ReactScanInternals.inspectState.kind !== 'inspecting') {
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
              inspectState.hoveredDomElement = el;
              updateOverlay(el, 'inspecting');
            }, 16);

            window.addEventListener('mousemove', mouseMove, { capture: true });

            const pointerDown = (e: MouseEvent) => {
              e.stopPropagation();

              const el = inspectState.hoveredDomElement;

              if (!el) {
                return;
              }

              updateOverlay(el, 'locked');

              restoreSizeFromLocalStorage(inspectState.propContainer);
              ReactScanInternals.inspectState = {
                kind: 'focused',
                focusedDomElement: el,
                propContainer: inspectState.propContainer,
              };
              if (!hasValidParent()) {
                const previousFocusBtn = document.getElementById(
                  'react-scan-previous-focus',
                )!;
                const parentFocusBtn = document.getElementById(
                  'react-scan-next-focus',
                )!;

                previousFocusBtn.style.display = 'none';
                parentFocusBtn.style.display = 'none';
              }
            };
            window.addEventListener('pointerdown', pointerDown, {
              capture: true,
            });

            const keyDown = (e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                ReactScanInternals.inspectState = {
                  kind: 'inspect-off',
                  propContainer: inspectState.propContainer,
                };
                clearCanvas();
              }
            };
            window.addEventListener('keydown', keyDown, { capture: true });

            return () => {
              window.removeEventListener('pointerdown', pointerDown, {
                capture: true,
              });
              window.removeEventListener('mousemove', mouseMove, {
                capture: true,
              });
              window.removeEventListener('keydown', keyDown, { capture: true });
              eventCatcher.parentNode?.removeChild(eventCatcher);
            };
          }
          case 'focused': {
            let lastBoundingRect: DOMRect | null = null;

            const updateOverlay = (element: HTMLElement) => {
              const newBoundingRect = element.getBoundingClientRect();

              if (lastBoundingRect &&
                lastBoundingRect.top === newBoundingRect.top &&
                lastBoundingRect.left === newBoundingRect.left &&
                lastBoundingRect.width === newBoundingRect.width &&
                lastBoundingRect.height === newBoundingRect.height) {
                return;
              }

              lastBoundingRect = newBoundingRect;
              drawHoverOverlay(
                element,
                canvas,
                ctx,
                'locked'
              );
            };

            recursiveRaf(() => {
              if (!document.contains(inspectState.focusedDomElement)) {
                setTimeout(() => {
                  clearCanvas();
                }, 500);
                inspectState.propContainer.style.maxHeight = '0';
                inspectState.propContainer.style.width = 'fit-content';
                inspectState.propContainer.innerHTML = '';
                ReactScanInternals.inspectState = {
                  kind: 'inspect-off',
                  propContainer: inspectState.propContainer,
                };
                return;
              }
              updateOverlay(inspectState.focusedDomElement);
            });

            const { parentCompositeFiber } =
              getCompositeComponentFromElement(inspectState.focusedDomElement);

            if (!parentCompositeFiber) {
              return;
            }

            const reportDataFiber =
              store.reportDataByFiber.get(parentCompositeFiber) ??
              (parentCompositeFiber.alternate
                ? store.reportDataByFiber.get(parentCompositeFiber.alternate)
                : null);

            const didRender = didFiberRender(parentCompositeFiber); // because we react to any change, not just this fibers change, we need this check to know if the current fiber re-rendered for this publish

            renderPropsAndState(
              didRender,
              parentCompositeFiber,
              reportDataFiber,
              inspectState.propContainer,
            );

            const keyDown = (e: KeyboardEvent) => {
              if (e.key === 'Escape') {
                clearCanvas();
                updateOverlay((e.target as HTMLElement) ?? inspectState.focusedDomElement);

                inspectState.propContainer.style.maxHeight = '0';
                inspectState.propContainer.style.width = 'fit-content';
                inspectState.propContainer.innerHTML = '';
                ReactScanInternals.inspectState = {
                  kind: 'inspecting',
                  hoveredDomElement:
                    (e.target as HTMLElement) ?? inspectState.focusedDomElement,
                  propContainer: inspectState.propContainer,
                };
              }
            };
            window.addEventListener('keydown', keyDown, {
              capture: true,
            });

            const onPointerDownCanvasLockIcon = (e: MouseEvent) => {
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
                adjustedX <=
                  currentLockIconRect.x + currentLockIconRect.width &&
                adjustedY >= currentLockIconRect.y &&
                adjustedY <= currentLockIconRect.y + currentLockIconRect.height
              ) {
                e.stopPropagation();

                inspectState.propContainer.innerHTML = '';
                inspectState.propContainer.style.maxHeight = '0';

                clearCanvas();
                updateOverlay(e.target as HTMLElement);

                ReactScanInternals.inspectState = {
                  kind: 'inspecting',
                  hoveredDomElement: e.target as HTMLElement,
                  propContainer: inspectState.propContainer,
                };

                return;
              }
            };
            window.addEventListener(
              'pointerdown',
              onPointerDownCanvasLockIcon,
              {
                capture: true,
              },
            );

            return () => {
              window.removeEventListener('keydown', keyDown, { capture: true });
              window.removeEventListener(
                'pointerdown',
                onPointerDownCanvasLockIcon,
                {
                  capture: true,
                },
              );
            };
          }
        }

        inspectState satisfies never;
      })();

      if (unSub) {
        unsubscribeFns[store.inspectState.kind] = unSub;
      }
    }, 16),
  );

  return () => {
    /**/
  };
};
