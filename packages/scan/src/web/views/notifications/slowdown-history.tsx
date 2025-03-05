import { useEffect, useRef, useState } from 'preact/compat';
import { cn } from '~web/utils/helpers';
import {
  type InteractionEvent,
  type NotificationEvent,
  getComponentName,
  getEventSeverity,
  getTotalTime,
  useNotificationsContext,
} from './data';
import {
  ClearIcon,
  KeyboardIcon,
  PointerIcon,
  TrendingDownIcon,
} from './icons';
import { Popover } from './popover';
import { iife } from '~core/notifications/performance-utils';
import { toolbarEventStore } from '~core/notifications/event-tracking';
import { type CollapsedDroppedFrame, CollapsedItem } from './collapsed-event';

const useFlashManager = (events: NotificationEvent[]) => {
  const prevEventsRef = useRef<NotificationEvent[]>([]);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevEventsRef.current = events;
      return;
    }

    const currentIds = new Set(events.map((e) => e.id));
    const prevIds = new Set(prevEventsRef.current.map((e) => e.id));

    const newIds = new Set<string>();
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        newIds.add(id);
      }
    }

    if (newIds.size > 0) {
      setNewEventIds(newIds);
      setTimeout(() => {
        setNewEventIds(new Set());
      }, 2000);
    }

    prevEventsRef.current = events;
  }, [events]);

  return (id: string) => newEventIds.has(id);
};

const useFlash = ({ shouldFlash }: { shouldFlash: boolean }) => {
  const [isFlashing, setIsFlashing] = useState(shouldFlash);
  useEffect(() => {
    if (shouldFlash) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldFlash]);

  return isFlashing;
};

export const SlowdownHistoryItem = ({
  event,
  shouldFlash,
}: {
  event: NotificationEvent;
  shouldFlash: boolean;
}) => {
  const { notificationState, setNotificationState } = useNotificationsContext();

  const severity = getEventSeverity(event);

  const isFlashing = useFlash({ shouldFlash });

  switch (event.kind) {
    case 'interaction': {
      return (
        <button
          type="button"
          onClick={() => {
            setNotificationState((prev) => ({
              ...prev,
              selectedEvent: event,
              route:
                prev.route === 'other-visualization' ||
                prev.route === 'optimize'
                  ? 'other-visualization'
                  : 'render-visualization',
              selectedFiber: null,
            }));
          }}
          className={cn([
            'pl-2 py-1.5  text-sm flex w-full items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden',
            event.id === notificationState.selectedEvent?.id && 'bg-[#18181B]',
            isFlashing &&
              'after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]',
          ])}
        >
          <div
            className={cn([
              'w-4/5 flex items-center justify-start h-full gap-x-1.5',
            ])}
          >
            <span className={cn(['min-w-fit text-xs'])}>
              {iife(() => {
                switch (event.type) {
                  case 'click': {
                    return <PointerIcon size={14} />;
                  }
                  case 'keyboard': {
                    return <KeyboardIcon size={14} />;
                  }
                }
              })}
            </span>

            <span className={cn(['text-xs pr-1 truncate'])}>
              {getComponentName(event.componentPath)}
            </span>
          </div>
          <div
            className={cn([' min-w-fit flex justify-end items-center ml-auto'])}
          >
            <div
              style={{
                lineHeight: '10px',
              }}
              className={cn([
                'gap-x-0.5 w-fit flex items-end justify-center h-full text-white px-1 py-1 rounded-sm font-semibold text-[10px]',
                severity === 'low' && 'bg-green-500/50',
                severity === 'needs-improvement' && 'bg-[#b77116] text-[10px]',
                severity === 'high' && 'bg-[#b94040]',
              ])}
            >
              <div
                style={{
                  lineHeight: '10px',
                }}
                className={cn(['text-[10px] text-white flex items-end'])}
              >
                {getTotalTime(event.timing).toFixed(0)}ms
              </div>
            </div>
          </div>
        </button>
      );
    }
    case 'dropped-frames': {
      return (
        <button
          type="button"
          onClick={() => {
            setNotificationState((prev) => ({
              ...prev,
              selectedEvent: event,
              route:
                prev.route === 'other-visualization' ||
                prev.route === 'optimize'
                  ? 'other-visualization'
                  : 'render-visualization',
              selectedFiber: null,
            }));
          }}
          className={cn([
            'pl-2 py-1.5  w-full text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden',
            event.id === notificationState.selectedEvent?.id && 'bg-[#18181B]',
            isFlashing &&
              'after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]',
          ])}
        >
          <div
            className={cn([
              'w-4/5 flex items-center justify-start h-full text-xs truncate',
            ])}
          >
            <TrendingDownIcon size={14} className="mr-1.5" /> FPS Drop
          </div>
          <div
            className={cn([' min-w-fit flex justify-end items-center ml-auto'])}
          >
            <div
              style={{
                lineHeight: '10px',
              }}
              className={cn([
                'w-fit flex items-center justify-center h-full text-white px-1 py-1 rounded-sm text-[10px] font-bold',
                severity === 'low' && 'bg-green-500/60',
                severity === 'needs-improvement' && 'bg-[#b77116] text-[10px]',
                severity === 'high' && 'bg-[#b94040]',
              ])}
            >
              {event.fps} FPS
            </div>
          </div>
        </button>
      );
    }
  }
};

type CollapsedKeyboardInput = {
  kind: 'collapsed-keyboard';
  events: Array<InteractionEvent>;
  timestamp: number;
};

type HistoryEvent =
  | {
      kind: 'single';
      event: NotificationEvent;
      timestamp: number;
    }
  | CollapsedKeyboardInput
  | CollapsedDroppedFrame;

const collapseEvents = (events: Array<NotificationEvent>) => {
  const newEvents = events.reduce<Array<HistoryEvent>>((prev, curr) => {
    const lastEvent = prev.at(-1);
    if (!lastEvent) {
      return [
        {
          kind: 'single',
          event: curr,
          timestamp: curr.timestamp,
        },
      ];
    }

    switch (lastEvent.kind) {
      case 'collapsed-keyboard': {
        if (
          curr.kind === 'interaction' &&
          curr.type === 'keyboard' &&
          // must be on the same semantic component, it would be ideal to compare on fiberId, but i digress
          curr.componentPath.join('-') ===
            lastEvent.events[0].componentPath.join('-')
        ) {
          const eventsWithoutLast = prev.filter((e) => e !== lastEvent);
          eventsWithoutLast.push({
            kind: 'collapsed-keyboard',
            events: [...lastEvent.events, curr],
            timestamp: Math.max(
              ...[...lastEvent.events, curr].map((e) => e.timestamp),
            ),
          });
          return eventsWithoutLast;
        }

        prev.push({
          kind: 'single',
          event: curr,
          timestamp: curr.timestamp,
        });
        return prev;
      }
      case 'single': {
        // if its a keyboard input on the same element
        if (
          lastEvent.event.kind === 'interaction' &&
          lastEvent.event.type === 'keyboard' &&
          curr.kind === 'interaction' &&
          curr.type === 'keyboard' &&
          lastEvent.event.componentPath.join('-') ===
            curr.componentPath.join('-')
        ) {
          const eventsWithoutLast = prev.filter((e) => e !== lastEvent);
          eventsWithoutLast.push({
            kind: 'collapsed-keyboard',
            events: [lastEvent.event, curr],
            timestamp: Math.max(lastEvent.event.timestamp, curr.timestamp),
          });
          return eventsWithoutLast;
        }
        if (
          lastEvent.event.kind === 'dropped-frames' &&
          curr.kind === 'dropped-frames'
        ) {
          const eventsWithoutLast = prev.filter((e) => e !== lastEvent);
          eventsWithoutLast.push({
            kind: 'collapsed-frame-drops',
            events: [lastEvent.event, curr],
            timestamp: Math.max(lastEvent.event.timestamp, curr.timestamp),
          });
          return eventsWithoutLast;
        }
        prev.push({
          kind: 'single',
          event: curr,
          timestamp: curr.timestamp,
        });
        return prev;
      }
      case 'collapsed-frame-drops': {
        if (curr.kind === 'dropped-frames') {
          const eventsWithoutLast = prev.filter((e) => e !== lastEvent);
          eventsWithoutLast.push({
            kind: 'collapsed-frame-drops',
            events: [...lastEvent.events, curr],
            timestamp: Math.max(
              ...[...lastEvent.events, curr].map((e) => e.timestamp),
            ),
          });
          return eventsWithoutLast;
        }
        prev.push({
          kind: 'single',
          event: curr,
          timestamp: curr.timestamp,
        });
        return prev;
      }
    }
  }, []);
  return newEvents;
};

export const useLaggedEvents = (lagMs = 150) => {
  const { notificationState } = useNotificationsContext();
  const [laggedEvents, setLaggedEvents] = useState(notificationState.events);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intended
  useEffect(() => {
    setTimeout(() => {
      setLaggedEvents(notificationState.events);
    }, lagMs);
  }, [notificationState.events]);

  return [laggedEvents, setLaggedEvents] as const;
};

export const SlowdownHistory = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const shouldFlash = useFlashManager(notificationState.events);
  const [laggedEvents, setLaggedEvents] = useLaggedEvents();
  // this is to avoid a flicker from our overlapping events deduping logic. This should be handled downstream, but this simplifies logic for now
  const collapsedEvents = collapseEvents(laggedEvents).toSorted(
    (a, b) => b.timestamp - a.timestamp,
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-y-2',
        'pt-2',
        'w-full h-full',
        'border-r border-[#27272A]',
        'overflow-y-auto',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between',
          'pl-3 pr-1',
          'w-full',
          'text-sm text-[#65656D]',
        )}
      >
        <span>History</span>
        <Popover
          wrapperProps={{
            className: 'h-full flex items-center justify-center ml-auto',
          }}
          triggerContent={
            <button
              type="button"
              className={cn(['hover:bg-[#18181B] rounded-full p-2'])}
              onClick={() => {
                toolbarEventStore.getState().actions.clear();
                setNotificationState((prev) => ({
                  ...prev,
                  selectedEvent: null,
                  selectedFiber: null,
                  route:
                    prev.route === 'other-visualization'
                      ? 'other-visualization'
                      : 'render-visualization',
                }));
                setLaggedEvents([]);
              }}
            >
              <ClearIcon className={cn([''])} size={16} />
            </button>
          }
        >
          <div className={cn(['w-full flex justify-center'])}>
            Clear all events
          </div>
        </Popover>
      </div>
      <div className={cn(['flex flex-col px-1 gap-y-1'])}>
        {collapsedEvents.length === 0 && (
          <div
            className={cn([
              'flex items-center justify-center text-zinc-500 text-sm py-4',
            ])}
          >
            No Events
          </div>
        )}
        {collapsedEvents.map((historyItem) =>
          iife(() => {
            switch (historyItem.kind) {
              case 'collapsed-keyboard': {
                return (
                  <CollapsedItem shouldFlash={shouldFlash} item={historyItem} />
                );
              }
              case 'single': {
                return (
                  <SlowdownHistoryItem
                    key={historyItem.event.id}
                    event={historyItem.event}
                    shouldFlash={shouldFlash(historyItem.event.id)}
                  />
                );
              }
              case 'collapsed-frame-drops': {
                return (
                  <CollapsedItem shouldFlash={shouldFlash} item={historyItem} />
                );
              }
            }
          }),
        )}
      </div>
    </div>
  );
};
