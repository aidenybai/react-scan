import { getDisplayName, getType } from 'bippy';
import { ReactNode } from 'preact/compat';
import {
  Dispatch,
  StateUpdater,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { inspectorState } from '.';
import { DiffValueView } from './diff-value';
import { isPromise } from './overlay/utils';
import {
  calculateTotalChanges,
  useInspectedFiberChangeStore,
} from './use-change-store';
import {
  AggregatedChanges,
  formatFunctionPreview,
  formatPath,
  getObjectDiff,
} from './utils';

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
  } catch (e) {
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

export type Setter<T> = Dispatch<StateUpdater<T>>;
export const WhatChanged = constant(() => {
  // if you are using the fiber for referential equality, use the fiberId
  const fiber = inspectorState.value.fiber;
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [unViewedChanges, setUnViewedChanges] = useState(0);

  const aggregatedChanges = useInspectedFiberChangeStore({
    onChangeUpdate: (count) => {
      setUnViewedChanges((prev) => prev + count);
    },
  });

  const shouldShowChanges = calculateTotalChanges(aggregatedChanges) > 0;

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

  const initializedContextChanges = new Map(
    Array.from(aggregatedChanges.contextChanges.entries())
      .filter(([, value]) => value.kind === 'initialized')
      .map(([key, value]) => [
        key,
        value.kind === 'partially-initialized' ? null! : value.changes,
      ]),
  );

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
              <Section title="Props" changes={aggregatedChanges.propsChanges} />
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
              <Section title="Context" changes={initializedContextChanges} />
            </DeferredRender>
          </div>
        </div>
      </div>
    </div>
  );
});

const renderStateName = (key: string, componentName: string) => {
  if (isNaN(Number(key))) {
    return key;
  }

  const n = parseInt(key);
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

const Section = ({
  changes,
  renderName = identity,
  title,
}: {
  title: string;
  changes: Map<any, AggregatedChanges>;
  renderName?: (name: string) => ReactNode;
}) => {
  const [expandedFns, setExpandedFns] = useState(new Set<string>());
  const [expandedEntries, setExpandedEntries] = useState(new Set<string>());
  if (changes.size === 0) {
    return null;
  }

  const entries = Array.from(changes.entries());

  // the level of component abstraction can be written better
  return (
    <div>
      <div className="text-xs text-[#888] mb-1.5">{title}</div>
      <div className="flex flex-col gap-2">
        {entries.map(([entryKey, change]) => {
          const isEntryExpanded = expandedEntries.has(String(entryKey));
          const { value: prevValue, error: prevError } = safeGetValue(
            change.previousValue,
          );
          const { value: currValue, error: currError } = safeGetValue(
            change.currentValue,
          );

          const diff = getObjectDiff(prevValue, currValue);

          return (
            <div key={entryKey}>
              <button
                onClick={() => {
                  setExpandedEntries((prev) => {
                    const next = new Set(prev);
                    if (next.has(String(entryKey))) {
                      next.delete(String(entryKey));
                    } else {
                      next.add(String(entryKey));
                    }
                    return next;
                  });
                }}
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
                      count={change.count}
                      showFlame={diff.changes.length === 0}
                      showFn={typeof change.currentValue === 'function'}
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
                    {prevError || currError ? (
                      <AccessError
                        currError={currError}
                        prevError={prevError}
                      />
                    ) : diff.changes.length > 0 ? (
                      <DiffChange
                        change={change}
                        diff={diff}
                        expandedFns={expandedFns}
                        renderName={renderName}
                        setExpandedFns={setExpandedFns}
                        title={title}
                      />
                    ) : (
                      <ReferenceOnlyChange
                        currValue={currValue}
                        entryKey={entryKey}
                        expandedFns={expandedFns}
                        prevValue={prevValue}
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
        key={i}
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
        <div
          className={cn(
            'group overflow-x-auto flex items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded-[2px]',
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
                      prevDiffValue as Function,
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
        </div>
        <div
          className={cn(
            'group flex overflow-x-auto items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded-[2px] mt-0.5',
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
                      currDiffValue as Function,
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
        </div>
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
  count,
  showFlame,
  showFn,
}: { count: number; showFlame: boolean; showFn: boolean }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    const element = badgeRef.current;
    if (!element) {
      return;
    }

    if (prevCount.current === count) {
      return;
    }

    element.classList.remove('count-flash');
    void element.offsetWidth;
    element.classList.add('count-flash');

    prevCount.current = count;
  }, [count]);

  return (
    <div
      ref={badgeRef}
      className={cn(
        'count-badge',
        'text-[#a855f7] text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-[4px] origin-center flex gap-x-2 items-center',
      )}
    >
      {showFlame && (
        <Icon
          name="icon-triangle-alert"
          className="text-yellow-500 mb-px"
          size={14}
        />
      )}
      {showFn && (
        <Icon name="icon-function" className="text-[#A855F7] mb-px" size={14} />
      )}
      x{count}
    </div>
  );
};
