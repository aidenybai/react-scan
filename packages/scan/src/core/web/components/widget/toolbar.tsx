import { useCallback, useEffect, useMemo } from 'preact/hooks';
import { cn, readLocalStorage, saveLocalStorage } from '@web-utils/helpers';
import { ReactScanInternals, setOptions, Store } from '../../../..';
import { INSPECT_TOGGLE_ID } from '../../inspect-element/inspect-state-machine';
import { getNearestFiberFromElement } from '../../inspect-element/utils';
import { Icon } from '../icon';
import { FpsMeter } from './FpsMeter';

interface ToolbarProps {
  refPropContainer: preact.RefObject<HTMLDivElement>;
}

export const Toolbar = ({ refPropContainer }: ToolbarProps) => {
  const inspectState = Store.inspectState;

  const instrumentation = ReactScanInternals.instrumentation;
  const isInspectFocused = inspectState.value.kind === 'focused';
  const isInspectActive = inspectState.value.kind === 'inspecting';

  const { inspectIcon, inspectColor } = useMemo(() => {
    let inspectIcon = null;
    let inspectColor = '#999';

    if (isInspectActive) {
      inspectIcon = <Icon name="icon-inspect" />;
      inspectColor = 'rgba(142, 97, 227, 1)';
    } else if (isInspectFocused) {
      inspectIcon = <Icon name="icon-focus" />;
      inspectColor = 'rgba(142, 97, 227, 1)';
    } else {
      inspectIcon = <Icon name="icon-inspect" />;
      inspectColor = '#999';
    }

    return { inspectIcon, inspectColor };
  }, [isInspectActive, isInspectFocused]);

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

  const onToggleActive = useCallback(() => {
    if (instrumentation) {
      instrumentation.isPaused.value = !instrumentation.isPaused.value;
      saveLocalStorage('react-scan-paused', instrumentation.isPaused.value);
    }
  }, []);

  const onSoundToggle = useCallback(() => {
    const newSoundState = !ReactScanInternals.options.value.playSound;
    setOptions({ playSound: newSoundState });
  }, []);

  useEffect(() => {
    const currentState = Store.inspectState.value;

    if (currentState.kind === 'uninitialized') {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: refPropContainer.current!,
      };
    }
  }, []);

  useEffect(() => {
    const savedPausedState = readLocalStorage<boolean>('react-scan-paused');
    if (savedPausedState !== null) {
      if (instrumentation) {
        instrumentation.isPaused.value = savedPausedState;
      }
    }
  }, []);

  return (
    <div className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden">
      <button
        id={INSPECT_TOGGLE_ID}
        title="Inspect element"
        onClick={onToggleInspect}
        className="flex items-center justify-center px-3"
        style={{ color: inspectColor }}
      >
        {inspectIcon}
      </button>
      <button
        id="react-scan-power"
        title={
          ReactScanInternals.instrumentation?.isPaused.value ? 'Start' : 'Stop'
        }
        onClick={onToggleActive}
        className={cn('flex items-center justify-center px-3', {
          'text-white': !ReactScanInternals.instrumentation?.isPaused.value,
          'text-[#999]': ReactScanInternals.instrumentation?.isPaused.value,
        })}
      >
        <Icon
          name={`icon-${ReactScanInternals.instrumentation?.isPaused.value ? 'eye-off' : 'eye'}`}
        />
      </button>
      <button
        id="react-scan-sound-toggle"
        onClick={onSoundToggle}
        title={
          ReactScanInternals.options.value.playSound ? 'Sound On' : 'Sound Off'
        }
        className={cn('flex items-center justify-center px-3', {
          'text-white': ReactScanInternals.options.value.playSound,
          'text-[#999]': !ReactScanInternals.options.value.playSound,
        })}
      >
        <Icon
          name={`icon-${ReactScanInternals.options.value.playSound ? 'volume-on' : 'volume-off'}`}
        />
      </button>

      {isInspectFocused && (
        <div
          className={cn(
            'flex items-stretch justify-between',
            'ml-auto',
            'border-l-1 border-white/10 text-[#999]',
            'overflow-hidden',
          )}
        >
          <button
            id="react-scan-previous-focus"
            title="Previous element"
            onClick={onPreviousFocus}
            className="flex items-center justify-center px-3"
          >
            <Icon name="icon-previous" />
          </button>
          <button
            id="react-scan-next-focus"
            title="Next element"
            onClick={onNextFocus}
            className="flex items-center justify-center px-3"
          >
            <Icon name="icon-next" />
          </button>
        </div>
      )}
      <div
        className={cn(
          'flex items-center justify-center whitespace-nowrap px-3 text-sm text-white',
          {
            'ml-auto': !isInspectFocused,
          },
        )}
      >
        <div>react-scan</div>
        <FpsMeter />
      </div>
    </div>
  );
};

export default Toolbar;
