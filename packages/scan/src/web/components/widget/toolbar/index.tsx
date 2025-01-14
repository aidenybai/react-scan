import { useCallback, useEffect, useRef } from 'preact/hooks';
import { ReactScanInternals, Store } from '~core/index';
import { Icon } from '~web/components/icon';
import FpsMeter from '~web/components/widget/fps-meter';
import { Arrows } from '~web/components/widget/toolbar/arrows';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';

export const Toolbar = constant(() => {
  const refSettingsButton = useRef<HTMLButtonElement>(null);

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

  const onToggleSettings = useCallback(() => {
    signalIsSettingsOpen.value = !signalIsSettingsOpen.value;
  }, []);

  useEffect(() => {
    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind === 'uninitialized') {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
      }
    });

    const unSubSettings = signalIsSettingsOpen.subscribe((state) => {
      refSettingsButton.current?.classList.toggle('text-inspect', state);
    });

    return () => {
      unSubState();
      unSubSettings();
    };
  }, []);

  let inspectIcon = null;
  let inspectColor = '#999';

  if (isInspectActive) {
    inspectIcon = <Icon name="icon-inspect" />;
    inspectColor = '#8e61e3';
  } else if (isInspectFocused) {
    inspectIcon = <Icon name="icon-focus" />;
    inspectColor = '#8e61e3';
  } else {
    inspectIcon = <Icon name="icon-inspect" />;
    inspectColor = '#999';
  }

  return (
    <div
      className={cn(
        'flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden',
        'border-t-1 border-white/10',
      )}
    >
      <button
        type="button"
        title="Inspect element"
        onClick={onToggleInspect}
        className="button flex items-center justify-center px-3"
        style={{ color: inspectColor }}
      >
        {inspectIcon}
      </button>

      <button
        id="react-scan-power"
        type="button"
        title={
          ReactScanInternals.instrumentation?.isPaused.value ? 'Start' : 'Stop'
        }
        onClick={onToggleActive}
        className={cn(
          'button',
          'flex items-center justify-center px-3',
          {
          'text-white': !ReactScanInternals.instrumentation?.isPaused.value,
          'text-[#999]': ReactScanInternals.instrumentation?.isPaused.value,
          })
        }
      >
        <Icon
          name={`icon-${ReactScanInternals.instrumentation?.isPaused.value ? 'eye-off' : 'eye'}`}
        />
      </button>
      <button
        ref={refSettingsButton}
        type="button"
        title="Settings"
        onClick={onToggleSettings}
        className="button flex items-center justify-center px-3"
      >
        <Icon name="icon-settings" />
      </button>

      <Arrows />
      <div
        className={cn(
          'flex items-center justify-center',
          'py-1.5 px-2',
          'whitespace-nowrap text-sm text-white',
        )}
      >
        react-scan
        <FpsMeter />
      </div>
    </div>
  );
});
