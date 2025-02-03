// @TODO: @pivanov - finish the pin functionality
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  type LocalStorageOptions,
  ReactScanInternals,
  Store,
} from '~core/index';
import { getFPS } from '~core/instrumentation';
import { useToolbarEventLog } from '~core/notifications/event-tracking';
import { signalIsSettingsOpen, signalNotificationsOpen } from '~web/state';
import { cn, readLocalStorage, saveLocalStorage } from '~web/utils/helpers';
import { Icon } from '~web/views/icon';
import { Notification } from '~web/views/notifications/icons';
import { fadeOutHighlights } from '~web/views/notifications/render-bar-chart';
import { Toggle } from '~web/views/toggle';
import { FpsMeter } from '../fps-meter';
import { useAppNotifications } from '~web/views/notifications/notifications';
import { getEventSeverity, getTotalTime } from '~web/views/notifications/data';

export const Toolbar = () => {
  const refSettingsButton = useRef<HTMLButtonElement>(null);
  const events = useAppNotifications();
  const [laggedEvents, setLaggedEvents] = useState(events);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLaggedEvents(events);
      // 500 + buffer to never see intermediary state
      // todo: check if we still need this large of buffer
    }, 500 + 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [events.length]);
  const inspectState = Store.inspectState;
  const isInspectActive = inspectState.value.kind === 'inspecting';
  const isInspectFocused = inspectState.value.kind === 'focused';

  const onToggleActive = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();

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
  useEffect(() => {
    return signalNotificationsOpen.subscribe((value) => {
      if (!value) {
        fadeOutHighlights();
      }
    });
  }, []);

  return (
    <div className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden gap-x-[6px]">
      <div className="h-full flex items-center min-w-fit">
        <div className="h-full flex items-center justify-center">
          <button
            type="button"
            id="react-scan-inspect-element"
            onClick={() => {
              const currentState = Store.inspectState.value;

              switch (currentState.kind) {
                case 'inspecting':
                  Store.inspectState.value = {
                    kind: 'inspect-off',
                  };
                  break;
                case 'focused':
                  Store.inspectState.value = {
                    kind: 'inspecting',
                    hoveredDomElement: null,
                  };
                  break;
                case 'inspect-off':
                  signalNotificationsOpen.value = false;
                  Store.inspectState.value = {
                    kind: 'inspecting',
                    hoveredDomElement: null,
                  };
                  break;
                case 'uninitialized':
                  break;
              }
            }}
            className="button flex items-center justify-center h-full w-full pl-3 pr-2.5"
            style={{ color: inspectColor }}
          >
            {inspectIcon}
          </button>
        </div>
        <div className="h-full flex items-center justify-center">
          <button
            type="button"
            id="react-scan-notifications"
            onClick={() => {
              Store.inspectState.value = {
                kind: 'inspect-off',
              };

              signalNotificationsOpen.value = !signalNotificationsOpen.value;
            }}
            className="button flex items-center justify-center h-full pl-2.5 pr-2.5"
            style={{ color: inspectColor }}
          >
            <Notification
              events={laggedEvents.map(
                (event) => getEventSeverity(event) === 'high',
              )}
              size={16}
              className={cn([
                'text-[#999]',
                signalNotificationsOpen.value && 'text-[#8E61E3]',
              ])}
            />
          </button>
        </div>

        <div className={cn(['min-w-fit flex flex-col items-center pl-1'])}>
          <div className="h-full flex items-center justify-center">
            <Toggle
              checked={!ReactScanInternals.instrumentation?.isPaused.value}
              onChange={onToggleActive}
            />
          </div>
        </div>

        {ReactScanInternals.options.value.showFPS && <FPSWrapper />}
      </div>
    </div>
  );
};

const FPSWrapper = () => {
  const [fps, setFps] = useState<null | number>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFps(getFPS());
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-x-2 px-1 ml-1 w-[72px]',
        'whitespace-nowrap text-sm text-white',
      )}
    >
      {/* fixme: default fps state*/}
      {fps === null ? <>️</> : <FpsMeter fps={fps} />}
    </div>
  );
};
