import { forwardRef } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { not_globally_unique_generateId } from '~core/monitor/utils';
import { useToolbarEventLog } from '~core/notifications/event-tracking';
import { FiberRenders } from '~core/notifications/performance';
import { iife, invariantError } from '~core/notifications/performance-utils';
import { playNotificationSound } from '~core/utils';
import { cn } from '~web/utils/helpers';
import {
  NotificationStateContext,
  NotificationsState,
  getEventSeverity,
  getTotalTime,
  useNotificationsContext,
} from './data';
import { DetailsRoutes } from './details-routes';
import { NotificationHeader } from './notification-header';
import { fadeOutHighlights } from './render-bar-chart';
import { SlowdownHistory, useLaggedEvents } from './slowdown-history';

const getGroupedFiberRenders = (fiberRenders: FiberRenders) => {
  const res = Object.values(fiberRenders).map((render) => ({
    id: not_globally_unique_generateId(),
    totalTime: render.nodeInfo.reduce((prev, curr) => prev + curr.selfTime, 0),
    count: render.nodeInfo.length,
    name: render.nodeInfo[0].name, // invariant, at least one exists,
    deletedAll: false,
    parents: render.parents,
    hasMemoCache: render.hasMemoCache,
    wasFiberRenderMount: render.wasFiberRenderMount,
    // it would be nice if we calculated the % of components memoizable, but this would have to be calculated downstream before it got aggregated
    elements: render.nodeInfo.map((node) => node.element),
    changes: {
      context: render.changes.fiberContext.current
        .filter((change) =>
          render.changes.fiberContext.changesCounts.get(change.name),
        )
        .map((change) => ({
          name: String(change.name),
          count:
            render.changes.fiberContext.changesCounts.get(change.name) ?? 0,
        })),
      props: render.changes.fiberProps.current
        .filter((change) =>
          render.changes.fiberProps.changesCounts.get(change.name),
        )
        .map((change) => ({
          name: String(change.name),
          count: render.changes.fiberProps.changesCounts.get(change.name) ?? 0,
        })),
      state: render.changes.fiberState.current
        .filter((change) =>
          render.changes.fiberState.changesCounts.get(Number(change.name)),
        )
        .map((change) => ({
          index: change.name as number,
          count:
            render.changes.fiberState.changesCounts.get(Number(change.name)) ??
            0,
        })),
    },
  }));

  return res;
};

const useGarbageCollectElements = (
  notificationEvents: NotificationsState['events'],
) => {
  useEffect(() => {
    const checkElementsExistence = () => {
      notificationEvents.forEach((event) => {
        if (!event.groupedFiberRenders) return;

        event.groupedFiberRenders.forEach((render) => {
          if (render.deletedAll) return;

          if (!render.elements || render.elements.length === 0) {
            render.deletedAll = true;
            return;
          }

          const initialLength = render.elements.length;
          render.elements = render.elements.filter((element) => {
            return element && element.isConnected;
          });

          if (render.elements.length === 0 && initialLength > 0) {
            render.deletedAll = true;
          }
        });
      });
    };

    const intervalId = setInterval(checkElementsExistence, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [notificationEvents]);
};

export const useAppNotifications = () => {
  const log = useToolbarEventLog();

  const notificationEvents: NotificationsState['events'] = [];

  useGarbageCollectElements(notificationEvents);

  log.state.events.forEach((event) => {
    const fiberRenders =
      event.kind === 'interaction'
        ? event.data.meta.detailedTiming.fiberRenders
        : event.data.meta.fiberRenders;
    const groupedFiberRenders = getGroupedFiberRenders(fiberRenders);
    const renderTime = groupedFiberRenders.reduce(
      (prev, curr) => prev + curr.totalTime,
      0,
    );
    switch (event.kind) {
      case 'interaction': {
        const { commitEnd, jsEndDetail, interactionStartDetail, rafStart } =
          event.data.meta.detailedTiming;

        // this is a known bug, js time doesn't backfill render time from async renders (or async js in general)
        // the current impl is a close enough approximation so will leave as is until there is a dedicated effort to fix it
        if (jsEndDetail - interactionStartDetail - renderTime < 0) {
          invariantError('js time must be longer than render time');
        }
        const otherJSTime = Math.max(
          0,
          jsEndDetail - interactionStartDetail - renderTime,
        );

        const frameDraw = Math.max(
          event.data.meta.latency - (commitEnd - interactionStartDetail),
          0,
        );
        notificationEvents.push({
          componentPath: event.data.meta.detailedTiming.componentPath,
          groupedFiberRenders,
          id: event.id,
          kind: 'interaction',
          memory: null,
          timestamp: event.data.startAt,
          type:
            event.data.meta.detailedTiming.interactionType === 'keyboard'
              ? 'keyboard'
              : 'click',
          timing: {
            renderTime: renderTime,
            kind: 'interaction',
            otherJSTime,
            framePreparation: rafStart - jsEndDetail,
            frameConstruction: commitEnd - rafStart,
            frameDraw,
          },
        });
        return;
      }
      case 'long-render': {
        notificationEvents.push({
          kind: 'dropped-frames',
          id: event.id,
          memory: null,
          timing: {
            kind: 'dropped-frames',
            renderTime: renderTime,
            otherTime: event.data.meta.latency,
          },
          groupedFiberRenders,
          timestamp: event.data.startAt,
          fps: event.data.meta.fps,
        });
        return;
      }
    }
  });
  return notificationEvents;
};
const timeout = 1000;
export const NotificationAudio = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const playedFor = useRef<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedTime = useRef<number>(0);

  const [laggedEvents] = useLaggedEvents();

  const alertEventsCount = laggedEvents.filter(
    // todo: make this configurable
    (event) => getEventSeverity(event) === 'high',
  ).length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // todo: sync with options
    const audioEnabledString = localStorage.getItem(
      'react-scan-notifications-audio',
    );

    if (audioEnabledString !== 'false' && audioEnabledString !== 'true') {
      localStorage.setItem('react-scan-notifications-audio', 'false');
      return;
    }

    const audioEnabled = audioEnabledString === 'false' ? false : true;

    if (audioEnabled) {
      setNotificationState((prev) => {
        if (prev.audioNotificationsOptions.enabled) {
          return prev;
        }
        return {
          ...prev,
          audioNotificationsOptions: {
            enabled: true,
            audioContext: new AudioContext(),
          },
        };
      });
      return;
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const { audioNotificationsOptions } = notificationState;
    if (!audioNotificationsOptions.enabled) {
      return;
    }
    if (alertEventsCount === 0) {
      return;
    }
    if (playedFor.current && playedFor.current >= alertEventsCount) {
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayedTime.current;
    const remainingDebounceTime = Math.max(0, timeout - timeSinceLastPlay);

    debounceTimeout.current = setTimeout(() => {
      playNotificationSound(audioNotificationsOptions.audioContext);
      playedFor.current = alertEventsCount;
      lastPlayedTime.current = Date.now();
      debounceTimeout.current = null;
    }, remainingDebounceTime);
  }, [alertEventsCount]);

  useEffect(() => {
    if (alertEventsCount !== 0) {
      return;
    }
    playedFor.current = null;
  }, [alertEventsCount]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return null;
};

export const NotificationWrapper = forwardRef<HTMLDivElement>((_, ref) => {
  const events = useAppNotifications();
  const [notificationState, setNotificationState] =
    useState<NotificationsState>({
      detailsExpanded: false,
      events,
      filterBy: 'latest',
      moreInfoExpanded: false,
      route: 'render-visualization',
      selectedEvent:
        events.toSorted((a, b) => a.timestamp - b.timestamp).at(-1) ?? null,
      selectedFiber: null,
      routeMessage: null,
      audioNotificationsOptions: {
        enabled: false,
        audioContext: null,
      },
    });

  notificationState.events = events;
  return (
    <NotificationStateContext.Provider
      value={{
        notificationState,
        setNotificationState,
        setRoute: ({ route, routeMessage }) => {
          setNotificationState((prev) => {
            const newState = { ...prev, route, routeMessage };
            switch (route) {
              case 'render-visualization': {
                fadeOutHighlights();
                return {
                  ...newState,
                  selectedFiber: null,
                };
              }
              case 'optimize': {
                fadeOutHighlights();
                return {
                  ...newState,
                  selectedFiber: null,
                };
              }
              case 'other-visualization': {
                fadeOutHighlights();
                return {
                  ...newState,
                  selectedFiber: null,
                };
              }
              case 'render-explanation': {
                // it would be ideal not to fade this out, but need to spend the time to sync the outline positions as they change in a performant (this was solved in react scan just need to follow same semantics)
                fadeOutHighlights();

                return newState;
              }
            }
            route satisfies never;
          });
        },
      }}
    >
      <NotificationAudio />
      <Notifications ref={ref} />
    </NotificationStateContext.Provider>
  );
});
export const Notifications = forwardRef<HTMLDivElement>((_, ref) => {
  const { notificationState } = useNotificationsContext();

  return (
    <div ref={ref} className={cn(['h-full w-full flex flex-col'])}>
      {notificationState.selectedEvent && (
        <div
          className={cn([
            'w-full h-[48px] flex flex-col',
            notificationState.moreInfoExpanded && 'h-[235px]',
            notificationState.moreInfoExpanded &&
              notificationState.selectedEvent.kind === 'dropped-frames' &&
              'h-[150px]',
          ])}
        >
          <NotificationHeader selectedEvent={notificationState.selectedEvent} />
          {notificationState.moreInfoExpanded && <MoreInfo />}
        </div>
      )}
      <div
        className={cn([
          'flex ',
          notificationState.selectedEvent ? 'h-[calc(100%-48px)]' : 'h-full',
          notificationState.moreInfoExpanded && 'h-[calc(100%-200px)]',
          notificationState.moreInfoExpanded &&
            notificationState.selectedEvent?.kind === 'dropped-frames' &&
            'h-[calc(100%-150px)]',
        ])}
      >
        <div className={cn(['h-full min-w-[200px]'])}>
          <SlowdownHistory />
        </div>
        <div className={cn(['w-[calc(100%-200px)] h-full overflow-y-auto'])}>
          <DetailsRoutes />
        </div>
      </div>
    </div>
  );
});

const MoreInfo = () => {
  const { notificationState } = useNotificationsContext();

  if (!notificationState.selectedEvent) {
    throw new Error('Invariant must have selected event for more info');
  }

  const event = notificationState.selectedEvent;

  return (
    <div
      className={cn([
        'px-4 py-2 border-b border-[#27272A] bg-[#18181B]/50 h-[calc(100%-40px)]',
        event.kind === 'dropped-frames' && `h-[calc(100%-25px)]`,
      ])}
    >
      <div className={cn(['flex flex-col gap-y-4 h-full'])}>
        {iife(() => {
          switch (event.kind) {
            case 'interaction': {
              return (
                <>
                  <div className={cn(['flex items-center gap-x-3'])}>
                    <span className="text-[#6F6F78] text-xs font-medium">
                      {event.type === 'click'
                        ? 'Clicked component location'
                        : 'Typed in component location'}
                    </span>
                    <div className="font-mono text-[#E4E4E7] flex items-center bg-[#27272A] pl-2 py-1 rounded-sm overflow-x-auto">
                      {event.componentPath.toReversed().map((part, i) => (
                        <>
                          <span
                            style={{
                              lineHeight: '14px',
                            }}
                            key={part}
                            className="text-[10px] whitespace-nowrap"
                          >
                            {part}
                          </span>
                          {i < event.componentPath.length - 1 && (
                            <span className="text-[#6F6F78] mx-0.5">‹</span>
                          )}
                        </>
                      ))}
                    </div>
                  </div>

                  <div className={cn(['flex items-center gap-x-3'])}>
                    <span className="text-[#6F6F78] text-xs font-medium">
                      Total Time
                    </span>
                    <span className="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                      {getTotalTime(event.timing).toFixed(0)}ms
                    </span>
                  </div>
                  <div className={cn(['flex items-center gap-x-3'])}>
                    <span className="text-[#6F6F78] text-xs font-medium">
                      Occurred
                    </span>
                    <span className="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                      {`${((Date.now() - event.timestamp) / 1000).toFixed(0)}s ago`}
                    </span>
                  </div>
                </>
              );
            }
            case 'dropped-frames': {
              return (
                <>
                  <div className={cn(['flex items-center gap-x-3'])}>
                    <span className="text-[#6F6F78] text-xs font-medium">
                      Total Time
                    </span>
                    <span className="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                      {getTotalTime(event.timing).toFixed(0)}ms
                    </span>
                  </div>

                  <div className={cn(['flex items-center gap-x-3'])}>
                    <span className="text-[#6F6F78] text-xs font-medium">
                      Occurred
                    </span>
                    <span className="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                      {`${((Date.now() - event.timestamp) / 1000).toFixed(0)}s ago`}
                    </span>
                  </div>
                </>
              );
            }
          }
        })}
      </div>
    </div>
  );
};
