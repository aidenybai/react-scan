import { useCallback, useEffect } from 'preact/hooks';
import { ReactScanInternals, Store, setOptions } from '~core/index';
import { Icon } from '~web/components/icon';
import FpsMeter from '~web/components/widget/fps-meter';
import { Arrows } from '~web/components/widget/toolbar/arrows';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact';

export const Toolbar = constant(() => {
  const inspectState = Store.inspectState;

  const isInspectActive = inspectState.value.kind === 'inspecting';
  const isInspectFocused = inspectState.value.kind === 'focused';

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
  }, []);

  const onToggleActive = useCallback(() => {
    if (ReactScanInternals.instrumentation) {
      ReactScanInternals.instrumentation.isPaused.value =
        !ReactScanInternals.instrumentation.isPaused.value;
    }
  }, []);

  const onSoundToggle = useCallback(() => {
    const newSoundState = !ReactScanInternals.options.value.playSound;
    setOptions({ playSound: newSoundState });
  }, []);

  useEffect(() => {
    const unsubscribe = Store.inspectState.subscribe((state) => {
      if (state.kind === 'uninitialized') {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

      <Arrows />
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
});

export default Toolbar;
