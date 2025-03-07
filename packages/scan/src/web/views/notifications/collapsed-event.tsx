import { useEffect, useRef, useState } from 'preact/hooks';
import {
  DroppedFramesEvent,
  getComponentName,
  getEventSeverity,
  InteractionEvent,
} from './data';
import { SlowdownHistoryItem } from './slowdown-history';
import { ChevronRight } from './icons';
import { cn } from '~web/utils/helpers';

export type CollapsedDroppedFrame = {
  kind: 'collapsed-frame-drops';
  events: Array<DroppedFramesEvent>;
  timestamp: number;
};

type CollapsedKeyboardInput = {
  kind: 'collapsed-keyboard';
  events: Array<InteractionEvent>;
  timestamp: number;
};
const useNestedFlash = ({
  flashingItemsCount,
  totalEvents,
}: {
  totalEvents: number; // this breaks if you have constant 1 item flashing, but the actual item is different over time (it's fine for now)
  flashingItemsCount: number;
}) => {
  const [newFlash, setNewFlash] = useState(false);
  const flashedFor = useRef(0);
  const lastFlashTime = useRef<number>(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (flashedFor.current >= totalEvents) {
      return;
    }

    const now = Date.now();
    const debounceTime = 250;
    const timeSinceLastFlash = now - lastFlashTime.current;

    if (timeSinceLastFlash >= debounceTime) {
      setNewFlash(false);
      const timeout = setTimeout(() => {
        flashedFor.current = totalEvents;
        lastFlashTime.current = Date.now();
        setNewFlash(true);
        // horrible, don't look at this, move along
        setTimeout(() => {
          setNewFlash(false);
        }, 2000);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const delayNeeded = debounceTime - timeSinceLastFlash;
      const timeout = setTimeout(() => {
        setNewFlash(false);
        setTimeout(() => {
          flashedFor.current = totalEvents;
          lastFlashTime.current = Date.now();
          setNewFlash(true);
          // horrible, don't look at this, move along
          setTimeout(() => {
            setNewFlash(false);
          }, 2000);
        }, 50);
      }, delayNeeded);
      return () => clearTimeout(timeout);
    }
  }, [flashingItemsCount]);

  return newFlash;
};

export const CollapsedItem = ({
  item,
  shouldFlash,
}: {
  item: CollapsedDroppedFrame | CollapsedKeyboardInput;
  shouldFlash: (id: string) => boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const severity = item.events.map(getEventSeverity).reduce((prev, curr) => {
    switch (curr) {
      case 'high': {
        return 'high';
      }
      case 'needs-improvement': {
        return prev === 'high' ? 'high' : 'needs-improvement';
      }
      case 'low': {
        return prev;
      }
    }
  }, 'low');
  const flashingItemsCount = item.events.reduce(
    (prev, curr) => (shouldFlash(curr.id) ? prev + 1 : prev),
    0,
  );

  const shouldFlashAgain = useNestedFlash({
    flashingItemsCount,
    totalEvents: item.events.length,
  });

  return (
    <div className={cn(['flex flex-col gap-y-0.5'])}>
      <button
        onClick={() => setExpanded((expanded) => !expanded)}
        className={cn([
          'pl-2 py-1.5  text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden',
          shouldFlashAgain &&
            !expanded &&
            'after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]',
        ])}
      >
        <div
          className={cn([
            'w-4/5 flex items-center justify-start h-full text-xs truncate gap-x-1.5',
          ])}
        >
          <span className={cn(['min-w-fit'])}>
            <ChevronRight
              key={`chevron-${item.timestamp}`}
              className={cn([
                'text-[#A1A1AA] transition-transform',
                expanded ? 'rotate-90' : '',
              ])}
              size={14}
            />
          </span>

          <span className={cn(['text-xs'])}>
            {item.kind === 'collapsed-frame-drops'
              ? 'FPS Drops'
              : getComponentName(item.events.at(0)?.componentPath ?? [])}
          </span>
        </div>
        <div
          className={cn(['ml-auto min-w-fit flex justify-end items-center'])}
        >
          <div
            style={{
              lineHeight: '10px',
            }}
            className={cn([
              'w-fit flex items-center text-[10px] justify-center h-full text-white px-1 py-1 rounded-sm font-semibold',
              severity === 'low' && 'bg-green-500/60',
              severity === 'needs-improvement' && 'bg-[#b77116] text-[10px]',
              severity === 'high' && 'bg-[#b94040]',
            ])}
          >
            x{item.events.length}
          </div>
        </div>
      </button>
      {expanded && (
        <IndentedContent>
          {item.events
            .toSorted((a, b) => b.timestamp - a.timestamp)
            .map((event) => (
              <SlowdownHistoryItem
                event={event}
                shouldFlash={shouldFlash(event.id)}
              />
            ))}
        </IndentedContent>
      )}
    </div>
  );
};

const IndentedContent = ({
  children,
}: { children: JSX.Element | JSX.Element[] }) => (
  <div className="relative pl-6 flex flex-col gap-y-1">
    <div className="absolute left-3 top-0 bottom-0 w-px bg-[#27272A]" />
    {children}
  </div>
);
