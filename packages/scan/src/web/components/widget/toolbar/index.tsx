import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { Store, ReactScanInternals, setOptions } from '~core/index';
import { Icon } from '~web/components/icon';
import { getInspectableElements } from '~web/components/inspector/utils';
import FpsMeter from '~web/components/widget/fps-meter';
import { Search } from '~web/components/widget/toolbar/search';
import { cn } from '~web/utils/helpers';

export const Toolbar = () => {
  const inspectState = Store.inspectState;

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
        };
        break;
      case 'focused':
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
        break;
      case 'inspect-off':
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
        };
        break;
      case 'uninitialized':
        break;
    }
  }, [Store.inspectState.value]);

  const findNextElement = useCallback(
    (currentElement: HTMLElement, direction: 'next' | 'previous') => {
      const allElements = getInspectableElements();
      const currentIndex = allElements.findIndex(item => item.element === currentElement);

      if (currentIndex === -1) return null;

      const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);
      return allElements[nextIndex]?.element || null;
    },
    []
  );

  const onPreviousFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const prevElement = findNextElement(
      currentState.focusedDomElement,
      'previous',
    );
    if (prevElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: prevElement,
      };
    }
  }, [findNextElement]);

  const onNextFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const nextElement = findNextElement(currentState.focusedDomElement, 'next');
    if (nextElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: nextElement
      };
    }
  }, [findNextElement]);

  const onToggleActive = useCallback(() => {
    if (ReactScanInternals.instrumentation) {
      ReactScanInternals.instrumentation.isPaused.value =
        !ReactScanInternals.instrumentation.isPaused.value;
    }
  }, [ReactScanInternals.instrumentation]);

  const onSoundToggle = useCallback(() => {
    const newSoundState = !ReactScanInternals.options.value.playSound;
    setOptions({ playSound: newSoundState });
  }, []);

  useEffect(() => {
    const currentState = Store.inspectState.value;

    if (currentState.kind === 'uninitialized') {
      Store.inspectState.value = {
        kind: 'inspect-off',
      };
    }
  }, []);

  // Add these states to track if prev/next are available
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // Add this effect to update the button states whenever focused element changes
  useEffect(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement) {
      setHasPrevious(false);
      setHasNext(false);
      return;
    }

    // Check if prev/next elements exist
    const prevElement = findNextElement(currentState.focusedDomElement, 'previous');
    const nextElement = findNextElement(currentState.focusedDomElement, 'next');

    setHasPrevious(!!prevElement);
    setHasNext(!!nextElement);
  }, [findNextElement, Store.inspectState.value]);

  return (
    <div className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden">
      <button
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
            disabled={!hasPrevious}
            className={cn(
              "flex items-center justify-center px-3",
              !hasPrevious && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon name="icon-previous" />
          </button>
          <Search />
          <button
            id="react-scan-next-focus"
            title="Next element"
            onClick={onNextFocus}
            disabled={!hasNext}
            className={cn(
              "flex items-center justify-center px-3",
              !hasNext && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon name="icon-next" />
          </button>
        </div>
      )}
      <div
        className={cn(
          'flex items-center justify-center whitespace-nowrap py-1.5 px-2 text-sm text-white',
          {
            'ml-auto': !isInspectFocused,
          },
        )}
      >
        react-scan
        <FpsMeter />
      </div>
    </div>
  );
};

export default Toolbar;
