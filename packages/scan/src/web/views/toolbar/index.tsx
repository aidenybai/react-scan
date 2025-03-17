import { useSignalEffect } from '@preact/signals';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import {
  type LocalStorageOptions,
  ReactScanInternals,
  Store,
} from '~core/index';
import { Icon } from '~web/components/icon';
import { Toggle } from '~web/components/toggle';
import { signalWidgetViews } from '~web/state';
import { cn, readLocalStorage, saveLocalStorage } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { FPSMeter } from '~web/widget/fps-meter';
import { getEventSeverity } from '../notifications/data';
import { Notification } from '../notifications/icons';
import { useAppNotifications } from '../notifications/notifications';

export const Toolbar = constant(() => {
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
  }, [events]);

  const inspectState = Store.inspectState;
  const isInspectActive = inspectState.value.kind === 'inspecting';
  const isInspectFocused = inspectState.value.kind === 'focused';

  const [seenEvents, setSeenEvents] = useState<Array<string>>([]);

  const onToggleInspect = useCallback(() => {
    const currentState = Store.inspectState.value;

    switch (currentState.kind) {
      case 'inspecting': {
        signalWidgetViews.value = {
          view: 'none',
        };
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
        return;
      }

      case 'focused': {
        signalWidgetViews.value = {
          view: 'inspector',
        };
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
        };
        return;
      }
      // todo: auto select the root fibers first stateNode, and tell the user to select the element
      case 'inspect-off': {
        signalWidgetViews.value = {
          view: 'none',
        };
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
        };
        return;
      }
      case 'uninitialized': {
        return;
      }
    }
  }, []);

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

  useSignalEffect(() => {
    const state = Store.inspectState.value;
    if (state.kind === 'uninitialized') {
      Store.inspectState.value = {
        kind: 'inspect-off',
      };
    }
  });

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    if (signalWidgetViews.value.view !== 'notifications') {
      return;
    }
    const ids = new Set(events.map((event) => event.id));
    setSeenEvents([...ids.values()]);
  }, [events.length, signalWidgetViews.value.view]);

  return (
    <div className="flex max-h-9 min-h-9 flex-1 items-stretch overflow-hidden">
      <div className="h-full flex items-center min-w-fit">
        <button
          type="button"
          id="react-scan-inspect-element"
          title="Inspect element"
          onClick={onToggleInspect}
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
            if (Store.inspectState.value.kind !== 'inspect-off') {
              Store.inspectState.value = {
                kind: 'inspect-off',
              };
            }
            switch (signalWidgetViews.value.view) {
              case 'inspector': {
                Store.inspectState.value = {
                  kind: 'inspect-off',
                };

                const ids = new Set(events.map((event) => event.id));
                setSeenEvents([...ids.values()]);
                signalWidgetViews.value = {
                  view: 'notifications',
                };
                return;
              }
              case 'notifications': {
                signalWidgetViews.value = {
                  view: 'none',
                };
                return;
              }
              case 'none': {
                const ids = new Set(events.map((event) => event.id));
                setSeenEvents([...ids.values()]);
                signalWidgetViews.value = {
                  view: 'notifications',
                };
                return;
              }
            }
          }}
          className="button flex items-center justify-center h-full pl-2.5 pr-2.5"
          style={{ color: inspectColor }}
        >
          <Notification
            events={laggedEvents
              .filter((event) => !seenEvents.includes(event.id))
              .map((event) => getEventSeverity(event) === 'high')}
            size={16}
            className={cn([
              'text-[#999]',
              signalWidgetViews.value.view === 'notifications' &&
                'text-[#8E61E3]',
            ])}
          />
        </button>
      </div>

      <Toggle
        checked={!ReactScanInternals.instrumentation?.isPaused.value}
        onChange={onToggleActive}
        className="place-self-center"
      />

      {/* todo add back showFPS*/}
      {ReactScanInternals.options.value.showFPS && <FPSMeter />}
    </div>
  );
});
