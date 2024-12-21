import { useRef, useEffect, useState } from 'preact/hooks';
import { getDisplayName } from 'bippy';
import { Store } from '../../../..';
import {
  getCompositeComponentFromElement,
  getOverrideMethods,
} from '../../inspect-element/utils';
import { replayComponent } from '../../inspect-element/view-state';
import { Icon } from '../icon';
import { Fiber } from 'react-reconciler';

const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  const replayState = useRef({
    isReplaying: false,
    timeoutId: undefined as TTimer,
    toggleDisabled: (disabled: boolean, button: HTMLElement) => {
      button.classList[disabled ? 'add' : 'remove']('disabled');
    },
  });

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = !!overrideProps;

  const handleReplay = (e: MouseEvent) => {
    e.stopPropagation();
    const state = replayState.current;
    const button = e.currentTarget as HTMLElement;

    const inspectState = Store.inspectState.value;
    if (state.isReplaying || inspectState.kind !== 'focused') return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(
      inspectState.focusedDomElement,
    );
    if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

    state.isReplaying = true;
    state.toggleDisabled(true, button);

    void replayComponent(parentCompositeFiber)
      .catch(() => void 0)
      .finally(() => {
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
          state.timeoutId = undefined;
        }
        if (document.hidden) {
          state.isReplaying = false;
          state.toggleDisabled(false, button);
        } else {
          state.timeoutId = setTimeout(() => {
            state.isReplaying = false;
            state.toggleDisabled(false, button);
          }, REPLAY_DELAY_MS);
        }
      });
  };

  if (!canEdit) return null;

  return (
    <button
      title="Replay component"
      className="react-scan-replay-button"
      onClick={handleReplay}
    >
      <Icon name="icon-replay" />
    </button>
  );
};
const useSubscribeFocusedFiber = (onUpdate: (fiber: Fiber) => void) => {
  useEffect(() => {
    const subscribe = () => {
      if (Store.inspectState.value.kind !== 'focused') {
        return;
      }

      const focusedElement = Store.inspectState.value.focusedDomElement;
      const { parentCompositeFiber } =
        getCompositeComponentFromElement(focusedElement);
      // invariant: parentCompositeFiber exists
      if (!parentCompositeFiber) return;
      onUpdate(parentCompositeFiber);
    };

    const unSubReportTime = Store.lastReportTime.subscribe(subscribe);
    const unSubState = Store.inspectState.subscribe(subscribe);
    return () => {
      unSubReportTime();
      unSubState();
    };
  }, []);
};

export const Header = () => {
  const [componentName, setComponentName] = useState<null | string>(null);
  const [componentRenders, setComponentRenders] = useState<null | number>(null);
  const [componentTime, setComponentTime] = useState<null | number>(null);

  useSubscribeFocusedFiber((fiber) => {
    const displayName = getDisplayName(fiber.type);
    const reportData = Store.reportData.get(fiber);
    setComponentName(displayName ?? 'Unknown');
    setComponentRenders(reportData?.count ?? null);
    setComponentTime(
      reportData?.time && reportData.time > 0 ? reportData?.time : null,
    );
  });

  // fixme: replace inline styles with direct tailwind usage
  return (
    <div class="react-scan-header">
      <div
        style={{
          gap: '0.5rem',
          display: 'flex',
          width: '50%',
          justifyContent: 'start',
          alignItems: 'center',
        }}
      >
        <span>{componentName}</span>
        {componentRenders !== null && <span>• x{componentRenders} </span>}
        {componentTime !== null && (
          <span class="react-scan-component-time">
            • {componentTime.toFixed(2)}ms
          </span>
        )}
      </div>
      <div
        style={{
          width: '50%',
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center',
          columnGap: '2px',
        }}
      >
        {/* enable again when feature provides more value (currently is confusing)*/}
        {/* <BtnReplay /> */}
        <button
          title="Close"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem',
            minWidth: 'fit-content',
            borderRadius: '0.25rem',
            transition: 'color 150ms linear',
          }}
          onClick={() => {
            if (Store.inspectState.value.propContainer) {
              Store.inspectState.value = {
                kind: 'inspect-off',
                propContainer: Store.inspectState.value.propContainer,
              };
            }
          }}
        >
          <Icon name="icon-close" />
        </button>
      </div>
    </div>
  );
};
