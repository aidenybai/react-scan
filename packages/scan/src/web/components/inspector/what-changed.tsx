import { getDisplayName, getType } from 'bippy';
import type { ReactNode } from 'preact/compat';
import {
  type Dispatch,
  type StateUpdater,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { isEqual } from '~core/utils';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { DiffValueView } from './diff-value';
import { isPromise } from './overlay/utils';
import { inspectorState, timelineState } from './states';
import {
  formatFunctionPreview,
  formatPath,
  getObjectDiff,
} from './utils';

export type Setter<T> = Dispatch<StateUpdater<T>>;

type AggregatedChanges = {
  count: number;
  currentValue: unknown;
  previousValue: unknown;
  name: string;
  id: string;
  lastUpdated: number;
};

type AllAggregatedChanges = {
  propsChanges: Map<string, AggregatedChanges>;
  stateChanges: Map<string, AggregatedChanges>;
  contextChanges: Map<
    number,
    | { changes: AggregatedChanges; kind: 'initialized' }
    | {
      kind: 'partially-initialized';
      value: unknown;
      name: string;
      lastUpdated: number;
      id: string;
    }
  >;
};

const calculateTotalChanges = (changes: AllAggregatedChanges): number => {
  return (
    Array.from(changes.propsChanges.values()).reduce(
      (acc, change) => acc + change.count,
      0,
    ) +
    Array.from(changes.stateChanges.values()).reduce(
      (acc, change) => acc + change.count,
      0,
    ) +
    Array.from(changes.contextChanges.values())
      .filter(
        (change): change is Extract<typeof change, { kind: 'initialized' }> =>
          change.kind === 'initialized',
      )
      .reduce((acc, change) => acc + change.changes.count, 0)
  );
};

const safeGetValue = (value: unknown): { value: unknown; error?: string } => {
  if (value === null || value === undefined) return { value };
  if (typeof value === 'function') return { value };
  if (typeof value !== 'object') return { value };

  if (isPromise(value)) {
    return { value: 'Promise' };
  }

  try {
    // proxies or getter errors
    const proto = Object.getPrototypeOf(value);
    if (proto === Promise.prototype || proto?.constructor?.name === 'Promise') {
      return { value: 'Promise' };
    }

    return { value };
  } catch {
    return { value: null, error: 'Error accessing value' };
  }
};

const DeferredRender = ({
  isExpanded,
  children,
}: { isExpanded: boolean; children: ReactNode }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!shouldRender) return null;

  return <div className="flex flex-col gap-2">{children}</div>;
};

export const WhatChanged = constant(() => {
  const fiber = inspectorState.value.fiber;
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [unViewedChanges, setUnViewedChanges] = useState(0);

  const { currentIndex, updates } = timelineState.value;
  const currentUpdate = updates[currentIndex];
  const prevUpdate = currentIndex > 0 ? updates[currentIndex - 1] : null;

  const aggregatedChanges = useMemo<AllAggregatedChanges>(() => {
    const changes: AllAggregatedChanges = {
      propsChanges: new Map<string, AggregatedChanges>(),
      stateChanges: new Map<string, AggregatedChanges>(),
      contextChanges: new Map(),
    };

    if (!currentUpdate || !prevUpdate) return changes;

    // Helper to get value consistently
    const getCurrentValue = (update: typeof currentUpdate, name: string, type: 'props' | 'state' | 'context') => {
      switch (type) {
        case 'props':
          return update.props.current.find(p => p.name === name)?.value;
        case 'state':
          return update.state.current.find(s => s.name === name)?.value;
        case 'context':
          return update.context.current.find(c => c.name === name)?.value;
      }
    };

    // Track current changes (for diff display)
    const trackChange = (
      map: Map<string, AggregatedChanges>,
      name: string,
      currentValue: unknown,
      previousValue: unknown,
      count: number
    ) => {
      map.set(name, {
        count,
        currentValue,
        previousValue,
        name,
        id: name,
        lastUpdated: currentUpdate.timestamp,
      });
    };

    // Count historical changes helper
    const countHistoricalChanges = (name: string, type: 'props' | 'state' | 'context') => {
      let count = 0;
      for (let i = 1; i <= currentIndex; i++) {
        const current = updates[i];
        const prev = updates[i - 1];
        if (!current || !prev) continue;

        const currentValue = getCurrentValue(current, name, type);
        const prevValue = getCurrentValue(prev, name, type);

        if (!isEqual(currentValue, prevValue)) {
          count++;
        }
      }
      return count;
    };

    // Compare props
    for (const { name, value } of currentUpdate.props.current) {
      const prevValue = getCurrentValue(prevUpdate, name, 'props');
      if (!isEqual(value, prevValue)) {
        const count = countHistoricalChanges(name, 'props');
        trackChange(changes.propsChanges, name, value, prevValue, count);
      }
    }

    // Compare state
    for (const { name, value } of currentUpdate.state.current) {
      const prevValue = getCurrentValue(prevUpdate, name, 'state');
      if (!isEqual(value, prevValue)) {
        const count = countHistoricalChanges(name, 'state');
        trackChange(changes.stateChanges, name, value, prevValue, count);
      }
    }

    // Compare context
    for (const { name, value } of currentUpdate.context.current) {
      const prevValue = getCurrentValue(prevUpdate, name, 'context');
      if (!isEqual(value, prevValue)) {
        const isNewlyInitialized = !prevValue && value !== undefined;

        if (isNewlyInitialized) {
          changes.contextChanges.set(Number(name), {
            kind: 'partially-initialized',
            value,
            name,
            lastUpdated: currentUpdate.timestamp,
            id: name,
          });
        } else {
          const count = countHistoricalChanges(name, 'context');
          changes.contextChanges.set(Number(name), {
            kind: 'initialized',
            changes: {
              count,
              currentValue: value,
              previousValue: prevValue,
              name,
              id: name,
              lastUpdated: currentUpdate.timestamp,
            },
          });
        }
      }
    }

    // Check for removed items
    const checkRemoved = (
      current: { name: string }[],
      prev: { name: string; value: unknown }[],
      map: Map<string, AggregatedChanges>,
      type: 'props' | 'state' | 'context'
    ) => {
      for (const { name, value } of prev) {
        if (!current.find(item => item.name === name)) {
          const count = countHistoricalChanges(name, type);
          trackChange(map, name, undefined, value, count);
        }
      }
    };

    checkRemoved(
      currentUpdate.props.current,
      prevUpdate.props.current,
      changes.propsChanges,
      'props'
    );

    checkRemoved(
      currentUpdate.state.current,
      prevUpdate.state.current,
      changes.stateChanges,
      'state'
    );

    // Check removed context items
    const contextMap = new Map<string, AggregatedChanges>();
    checkRemoved(
      currentUpdate.context.current,
      prevUpdate.context.current,
      contextMap,
      'context'
    );

    // Convert to initialized context changes
    for (const [key, change] of contextMap) {
      changes.contextChanges.set(Number(key), {
        kind: 'initialized',
        changes: change
      });
    }

    return changes;
  }, [currentUpdate, prevUpdate, currentIndex, updates]);

  const shouldShowChanges = calculateTotalChanges(aggregatedChanges) > 0;

  // Combined effect for handling unViewedChanges
  useEffect(() => {
    if (isExpanded) {
      setUnViewedChanges(0);
    } else if (shouldShowChanges && hasInitialized) {
      setUnViewedChanges(prev => prev + 1);
    }
  }, [shouldShowChanges, isExpanded, hasInitialized]);

  // this prevents the notifications to show after we completed logic to auto open
  // the accordion (we explicitly want the accordion animation when first changes appear)
  useEffect(() => {
    if (!hasInitialized && shouldShowChanges) {
      const timer = setTimeout(() => {
        setHasInitialized(true);
        requestAnimationFrame(() => {
          setIsExpanded(true);
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hasInitialized, shouldShowChanges]);

  const initializedContextChanges = new Map();
  for (const [key, value] of aggregatedChanges.contextChanges) {
    if (value.kind === 'initialized') {
      initializedContextChanges.set(key, value.changes);
    }
  }

  if (!shouldShowChanges) {
    return null;
  }

  return (
    <div
      className={cn('react-scan-what-changed-expandable', {
        'react-scan-expanded': shouldShowChanges,
      })}
    >
      <div
        className="flex flex-col p-0.5 bg-[#0a0a0a] overflow-hidden border-b-1 border-[#222]"
        style={{
          opacity: shouldShowChanges ? 1 : 0,
          transition: 'opacity 150ms ease',
        }}
      >
        <WhatsChangedHeader
          isExpanded={isExpanded}
          hasInitialized={hasInitialized}
          setIsExpanded={setIsExpanded}
          setUnViewedChanges={setUnViewedChanges}
          unViewedChanges={unViewedChanges}
        />
        <div
          className={cn('react-scan-what-changed-expandable', {
            'react-scan-expanded': isExpanded,
          })}
        >
          <div className={cn(['px-4 ', isExpanded && 'py-2'])}>
            <DeferredRender isExpanded={isExpanded}>
              <Section
                title="Props"
                changes={aggregatedChanges.propsChanges}
              />
              <Section
                title="State"
                changes={aggregatedChanges.stateChanges}
                renderName={(name) =>
                  renderStateName(
                    name,
                    getDisplayName(getType(fiber)) ?? 'Unknown Component',
                  )
                }
              />
              <Section
                title="Context"
                changes={initializedContextChanges}
              />
            </DeferredRender>
          </div>
        </div>
      </div>
    </div>
  );
});

const renderStateName = (key: string, componentName: string) => {
  if (Number.isNaN(Number(key))) {
    return key;
  }

  const n = Number.parseInt(key);
  const getOrdinalSuffix = (num: number) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };
  return (
    <span>
      {n}
      {getOrdinalSuffix(n)} hook{' '}
      <span style={{ color: '#666' }}>
        called in{' '}
        <i
          style={{
            color: '#A855F7',
          }}
        >
          {componentName}
        </i>
      </span>
    </span>
  );
};

const WhatsChangedHeader = ({
  isExpanded,
  setIsExpanded,
  setUnViewedChanges,
  unViewedChanges,
  hasInitialized,
}: {
  setIsExpanded: Setter<boolean>;
  setUnViewedChanges: Setter<number>;
  isExpanded: boolean;
  unViewedChanges: number;
  hasInitialized: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        setIsExpanded((state) => {
          setUnViewedChanges(0);
          return !state;
        });
      }}
      className="flex items-center gap-x-2 w-full p-1 cursor-pointer text-[13px] tracking-[0.01em]"
    >
      <div className="flex items-center">
        <span className="flex w-4 items-center justify-center">
          <Icon
            name="icon-chevron-right"
            size={10}
            className={cn('opacity-70 transition-transform duration-200', {
              'rotate-90': isExpanded,
            })}
          />
        </span>
        <span className="font-medium text-white">What changed?</span>
      </div>
      {!isExpanded && unViewedChanges > 0 && hasInitialized && (
        <div className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 bg-purple-500 text-white text-xs font-medium rounded-full transition-all duration-300">
          {unViewedChanges}
        </div>
      )}
    </button>
  );
};

const identity = <T,>(x: T) => x;

type SectionType = 'props' | 'state' | 'context';

const useChangeValues = (change: AggregatedChanges) => {
  return useMemo(() => {
    const { value: prevValue, error: prevError } = safeGetValue(change.previousValue);
    const { value: currValue, error: currError } = safeGetValue(change.currentValue);
    const diff = getObjectDiff(prevValue, currValue);

    return {
      prevValue,
      currValue,
      prevError,
      currError,
      diff,
      isFunction: typeof change.currentValue === 'function'
    };
  }, [change.previousValue, change.currentValue]);
};

const Section = ({
  changes,
  renderName = identity,
  title,
}: {
  title: string;
    changes: Map<string, AggregatedChanges>;
  renderName?: (name: string) => ReactNode;
}) => {
  const [expandedFns, setExpandedFns] = useState(new Set<string>());
  const [expandedEntries, setExpandedEntries] = useState(new Set<string>());

  const entries = useMemo(() => Array.from(changes.entries()), [changes]);
  const sectionType = useMemo(() => title.toLowerCase() as SectionType, [title]);

  const handleExpandEntry = useCallback((entryKey: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(String(entryKey))) {
        next.delete(String(entryKey));
      } else {
        next.add(String(entryKey));
      }
      return next;
    });
  }, []);

  if (changes.size === 0) {
    return null;
  }

  return (
    <div>
      <div className="text-xs text-[#888] mb-1.5">{title}</div>
      <div className="flex flex-col gap-2">
        {entries.map(([entryKey, change]) => {
          const isEntryExpanded = expandedEntries.has(String(entryKey));
          const values = useChangeValues(change);

          return (
            <div key={entryKey}>
              <button
                type="button"
                onClick={() => handleExpandEntry(entryKey)}
                className="flex items-center gap-2 w-full bg-transparent border-none p-0 cursor-pointer text-white text-xs"
              >
                <div className="flex items-center gap-1.5 flex-1">
                  <Icon
                    name="icon-chevron-right"
                    size={12}
                    className={cn(
                      'text-[#666] transition-transform duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                      {
                        'rotate-90': isEntryExpanded,
                      },
                    )}
                  />
                  <div className="whitespace-pre-wrap break-words text-left font-medium flex items-center gap-x-1.5">
                    {renderName(change.name)}
                    <CountBadge
                      entryKey={entryKey}
                      sectionType={sectionType}
                      change={change}
                    />
                  </div>
                </div>
              </button>
              <div
                className={cn('react-scan-expandable', {
                  'react-scan-expanded': isEntryExpanded,
                })}
              >
                <div className="pl-3 text-xs font-mono border-l-1 border-[#333]">
                  <div className="flex flex-col gap-0.5">
                    {values.prevError || values.currError ? (
                      <AccessError
                        currError={values.currError}
                        prevError={values.prevError}
                      />
                    ) : values.diff.changes.length > 0 ? (
                      <DiffChange
                        change={change}
                          diff={values.diff}
                        expandedFns={expandedFns}
                        renderName={renderName}
                        setExpandedFns={setExpandedFns}
                        title={title}
                      />
                    ) : (
                      <ReferenceOnlyChange
                            currValue={values.currValue}
                        entryKey={entryKey}
                        expandedFns={expandedFns}
                            prevValue={values.prevValue}
                        setExpandedFns={setExpandedFns}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AccessError = ({
  prevError,
  currError,
}: {
  prevError?: string;
  currError?: string;
}) => {
  return (
    <>
      {prevError && (
        <div className="text-[#f87171] bg-[#2a1515] px-1.5 py-[3px] rounded-[2px] italic">
          {prevError}
        </div>
      )}
      {currError && (
        <div className="text-[#4ade80] bg-[#1a2a1a] px-1.5 py-[3px] rounded-[2px] italic mt-0.5">
          {currError}
        </div>
      )}
    </>
  );
};

const DiffChange = ({
  diff,
  title,
  renderName,
  change,
  expandedFns,
  setExpandedFns,
}: {
  diff: {
    changes: {
      path: string[];
      prevValue: unknown;
      currentValue: unknown;
    }[];
  };
  title: string;
  renderName: (name: string) => ReactNode;
  change: { name: string };
  expandedFns: Set<string>;
  setExpandedFns: (updater: (prev: Set<string>) => Set<string>) => void;
}) => {
  return diff.changes.map((diffChange, i) => {
    const { value: prevDiffValue, error: prevDiffError } = safeGetValue(
      diffChange.prevValue,
    );
    const { value: currDiffValue, error: currDiffError } = safeGetValue(
      diffChange.currentValue,
    );

    const isFunction =
      typeof prevDiffValue === 'function' ||
      typeof currDiffValue === 'function';

    // todo: split up function view and normal view
    return (
      <div
        key={`${formatPath(diffChange.path)}-${i}`}
        className="flex flex-col"
        style={{
          marginBottom: i < diff.changes.length - 1 ? '8px' : 0,
        }}
      >
        <div className="text-[#666] text-[10px] mb-0.5">
          {(() => {
            if (title === 'Props') {
              return diffChange.path.length > 0
                ? `${renderName(change.name)}.${formatPath(diffChange.path)}`
                : '';
            }
            if (title === 'State' && diffChange.path.length > 0) {
              return `state.${formatPath(diffChange.path)}`;
            }
            return formatPath(diffChange.path);
          })()}
        </div>
        <button
          type="button"
          className={cn(
            'text-left group overflow-x-auto flex items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded-[2px]',
            isFunction && 'cursor-pointer',
          )}
          onClick={
            isFunction
              ? () => {
                  const fnKey = `${formatPath(diffChange.path)}-prev`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(fnKey)) {
                      next.delete(fnKey);
                    } else {
                      next.add(fnKey);
                    }
                    return next;
                  });
                }
              : undefined
          }
        >
          <span className="w-3 opacity-50">-</span>
          <span className="flex-1 whitespace-pre-wrap font-mono">
            {prevDiffError ? (
              <span className="italic text-[#f87171]">{prevDiffError}</span>
            ) : isFunction ? (
              <div className="flex gap-1 items-start flex-col">
                <div className="flex gap-1 items-start w-full">
                  <span className="flex-1">
                    {formatFunctionPreview(
                      prevDiffValue as (...args: unknown[]) => unknown,
                      expandedFns.has(`${formatPath(diffChange.path)}-prev`),
                    )}
                  </span>
                  {typeof prevDiffValue === 'function' && (
                    <CopyToClipboard
                      text={prevDiffValue.toString()}
                      className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                    </CopyToClipboard>
                  )}
                </div>
                {prevDiffValue?.toString() === currDiffValue?.toString() && (
                  <div className="text-[10px] text-[#666] italic">
                    Function reference changed
                  </div>
                )}
              </div>
            ) : (
              <DiffValueView
                value={prevDiffValue}
                expanded={expandedFns.has(
                  `${formatPath(diffChange.path)}-prev`,
                )}
                onToggle={() => {
                  const key = `${formatPath(diffChange.path)}-prev`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  });
                }}
                isNegative={true}
              />
            )}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            'text-left group flex overflow-x-auto items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded-[2px] mt-0.5',
            isFunction && 'cursor-pointer',
          )}
          onClick={
            isFunction
              ? () => {
                  const fnKey = `${formatPath(diffChange.path)}-current`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(fnKey)) {
                      next.delete(fnKey);
                    } else {
                      next.add(fnKey);
                    }
                    return next;
                  });
                }
              : undefined
          }
        >
          <span className="w-3 opacity-50">+</span>
          <span className="flex-1 whitespace-pre-wrap font-mono">
            {currDiffError ? (
              <span className="italic text-[#4ade80]">{currDiffError}</span>
            ) : isFunction ? (
              <div className="flex gap-1 items-start flex-col">
                <div className="flex gap-1 items-start w-full">
                  <span className="flex-1">
                    {formatFunctionPreview(
                      currDiffValue as (...args: unknown[]) => unknown,
                      expandedFns.has(`${formatPath(diffChange.path)}-current`),
                    )}
                  </span>
                  {typeof currDiffValue === 'function' && (
                    <CopyToClipboard
                      text={currDiffValue.toString()}
                      className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                    </CopyToClipboard>
                  )}
                </div>
                {prevDiffValue?.toString() === currDiffValue?.toString() && (
                  <div className="text-[10px] text-[#666] italic">
                    Function reference changed
                  </div>
                )}
              </div>
            ) : (
              <DiffValueView
                value={currDiffValue}
                expanded={expandedFns.has(
                  `${formatPath(diffChange.path)}-current`,
                )}
                onToggle={() => {
                  const key = `${formatPath(diffChange.path)}-current`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  });
                }}
                isNegative={false}
              />
            )}
          </span>
        </button>
      </div>
    );
  });
};

const ReferenceOnlyChange = ({
  prevValue,
  currValue,
  entryKey,
  expandedFns,
  setExpandedFns,
}: {
  prevValue: unknown;
  currValue: unknown;
  entryKey: string;
  expandedFns: Set<string>;
  setExpandedFns: (updater: (prev: Set<string>) => Set<string>) => void;
}) => {
  return (
    <>
      <div className="group flex items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded-[2px]">
        <span className="w-3 opacity-50">-</span>
        <span className="flex-1 whitespace-pre-wrap font-mono">
          <DiffValueView
            value={prevValue}
            expanded={expandedFns.has(`${entryKey}-prev`)}
            onToggle={() => {
              const key = `${entryKey}-prev`;
              setExpandedFns((prev) => {
                const next = new Set(prev);
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                return next;
              });
            }}
            isNegative={true}
          />
        </span>
      </div>
      <div className="group flex items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded-[2px] mt-0.5">
        <span className="w-3 opacity-50">+</span>
        <span className="flex-1 whitespace-pre-wrap font-mono">
          <DiffValueView
            value={currValue}
            expanded={expandedFns.has(`${entryKey}-current`)}
            onToggle={() => {
              const key = `${entryKey}-current`;
              setExpandedFns((prev) => {
                const next = new Set(prev);
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                return next;
              });
            }}
            isNegative={false}
          />
        </span>
      </div>
      {typeof currValue === 'object' && currValue !== null && (
        <div className="text-[#666] text-[10px] italic mt-1">
          Reference changed but objects are the same
        </div>
      )}
    </>
  );
};

const CountBadge = ({
  entryKey,
  sectionType,
  change,
}: {
  entryKey: string;
  sectionType: SectionType;
  change: AggregatedChanges;
}) => {
  const refBadge = useRef<HTMLDivElement>(null);
  const values = useChangeValues(change);
  const { currentIndex, updates } = timelineState.value;

  // Count how many times this entry has changed in the timeline
  const count = useMemo(() => {
    let changeCount = 0;
    for (let i = 1; i <= currentIndex; i++) {
      const current = updates[i];
      const prev = updates[i - 1];
      if (!current || !prev) continue;

      const getCurrentValue = (update: typeof current) => {
        switch (sectionType) {
          case 'props':
            return update.props.current.find(p => p.name === entryKey)?.value;
          case 'state':
            return update.state.current.find(s => s.name === entryKey)?.value;
          case 'context':
            return update.context.current.find(c => c.name === entryKey)?.value;
        }
      };

      const currentValue = getCurrentValue(current);
      const prevValue = getCurrentValue(prev);

      if (!isEqual(currentValue, prevValue)) {
        changeCount++;
      }
    }
    return changeCount;
  }, [currentIndex, updates, sectionType, entryKey]);

  const prevCount = useRef(count);

  useEffect(() => {
    const element = refBadge.current;
    if (!element || prevCount.current === count) {
      return;
    }

    element.classList.remove('count-flash');
    void element.offsetWidth;
    element.classList.add('count-flash');

    prevCount.current = count;
  }, [count]);

  return (
    <div
      ref={refBadge}
      className={cn(
        'count-badge',
        'text-[#a855f7] text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-[4px] origin-center flex gap-x-2 items-center',
      )}
    >
      {values.diff.changes.length === 0 && (
        <Icon
          name="icon-triangle-alert"
          className="text-yellow-500 mb-px"
          size={14}
        />
      )}
      {values.isFunction && (
        <Icon name="icon-function" className="text-[#A855F7] mb-px" size={14} />
      )}
      x{count}
    </div>
  );
};
