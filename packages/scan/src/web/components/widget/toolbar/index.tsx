import { useCallback, useEffect, useRef } from 'preact/hooks';
import {
  LocalStorageOptions,
  ReactScanInternals,
  setOptions,
  Store,
} from '~core/index';
import { Icon } from '~web/components/icon';
import FpsMeter from '~web/components/widget/fps-meter';
import { Arrows } from '~web/components/widget/toolbar/arrows';
import { signalIsSettingsOpen } from '~web/state';
import { cn, readLocalStorage, saveLocalStorage } from '~web/utils/helpers';
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
    if (!ReactScanInternals.instrumentation) {
      return;
    }
    // todo: set a single source of truth
    const isPaused = !ReactScanInternals.instrumentation.isPaused.value;
    ReactScanInternals.instrumentation.isPaused.value = isPaused;
    const existingLocalStorageOptions =
      readLocalStorage<LocalStorageOptions>('react-scan-options');
    saveLocalStorage('react-scan-options', {
      ...existingLocalStorageOptions,
      enabled: !isPaused,
    });
  }, []);

  // const onToggleSettings = useCallback(() => {
  //   signalIsSettingsOpen.value = !signalIsSettingsOpen.value;
  // }, []);

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
        'flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden gap-x-[6px]',
        // isInspectFocused && 'border-t-1 border-white/10',
      )}
    >
      <div className="h-full flex items-center min-w-fit gap-x-[6px]">
        <button
          type="button"
          id="react-scan-inspect-element"
          title="Inspect element"
          onClick={onToggleInspect}
          className="button flex items-center justify-center px-3 h-full"
          style={{ color: inspectColor }}
        >
          {inspectIcon}
        </button>

        <label className="switch">
          <input
            type="checkbox"
            id="react-scan-power"
            title={
              ReactScanInternals.instrumentation?.isPaused.value
                ? 'Start'
                : 'Stop'
            }
            checked={!ReactScanInternals.instrumentation?.isPaused.value}
            onChange={onToggleActive}
          />
          <span className="slider round"></span>
        </label>
        {/* <button
        ref={refSettingsButton}
        type="button"
        title="Settings"
        onClick={onToggleSettings}
        className="button flex items-center justify-center px-3"
      >
        <Icon name="icon-settings" />
      </button> */}

        {/* todo, only render arrows when inspecting element */}

        {/* i think i want to put wrap this with config if user doesn't want to see it (specifically robinhood) */}
      </div>
      <div
        className={cn(
          'flex items-center justify-end w-full',
          'py-1.5 px-2',
          'whitespace-nowrap text-sm text-white',
        )}
      >
        react-scan
        {/* this fps meter is bad we can improve it */}
        <FpsMeter />
      </div>
    </div>
  );
});
