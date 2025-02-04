import { type ReactNode, memo } from 'preact/compat';
import {
  type Dispatch,
  type StateUpdater,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { isEqual } from '~core/utils';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { StickySection } from '~web/components/sticky-section';
import type { useMergedRefs } from '~web/hooks/use-merged-refs';
import { cn } from '~web/utils/helpers';
import { throttle } from '~web/utils/helpers';
import { DiffValueView } from './diff-value';
import { type MinimalFiberInfo, timelineState } from './states';
import { Timeline } from './timeline';
import { formatFunctionPreview, formatPath, getObjectDiff, isPromise } from './utils';

export type Setter<T> = Dispatch<StateUpdater<T>>;

type Change = {
  name: string | number;
  value: unknown;
  prevValue?: unknown;
  count: number;
};

const safeGetValue = (value: unknown): { value: unknown; error?: string } => {
  if (value === null || value === undefined) return { value };
  if (typeof value === 'function') return { value };
  if (typeof value !== 'object') return { value };

  if (isPromise(value)) {
    return { value: 'Promise' };
  }

  try {
    const proto = Object.getPrototypeOf(value);
    if (proto === Promise.prototype || proto?.constructor?.name === 'Promise') {
      return { value: 'Promise' };
    }

    return { value };
  } catch {
    return { value: null, error: 'Error accessing value' };
  }
};

interface WhatChangedProps {
  isSticky?: boolean;
  refSticky?:
  | ReturnType<typeof useMergedRefs<HTMLElement>>
  | ((node: HTMLElement | null) => void);
  calculateStickyTop: (removeSticky?: boolean) => void;
  shouldShowChanges: boolean;
}

export const WhatChangedSection = memo(() => {
  const refShowTimeline = useRef(false);
  const [shouldShowChanges, setShouldShowChanges] = useState(true);
  useEffect(() => {
    const rafId = 0;

    const unsubscribe = timelineState.subscribe(async (state) => {
      cancelAnimationFrame(rafId);

      const { currentIndex, updates } = state;

      if (currentIndex === 0) {
        setShouldShowChanges(false);
        return;
      }

      if (updates.length > 0) {
        if (!refShowTimeline.current) {
          refShowTimeline.current = true;
        }
        setShouldShowChanges(true);
      }
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {
        refShowTimeline.current && (
          <StickySection>
            {(props) => (
              <Timeline {...props} />
            )}
          </StickySection>
        )
      }
      <StickySection>
        {(props) => (
          <WhatChanged
            {...props}
            shouldShowChanges={shouldShowChanges}
          />
        )}
      </StickySection>
    </>
  );
});

export const WhatChanged = memo(({
  isSticky,
  refSticky,
  calculateStickyTop,
  shouldShowChanges,
}: WhatChangedProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <WhatsChangedHeader
        refSticky={refSticky}
        isSticky={isSticky}
        calculateStickyTop={calculateStickyTop}
        isExpanded={isExpanded}
        shouldShowChanges={shouldShowChanges}
        setIsExpanded={setIsExpanded}
      />
      <div
        className={cn('react-scan-expandable', {
          'react-scan-expanded': isExpanded,
        })}
      >
        <div className="overflow-hidden">
          {
            shouldShowChanges && (
              <div
                className={cn(
                  'relative',
                  'flex flex-col gap-y-2',
                  'pl-9 pr-2',
                  'before:content-[""] before:absolute before:inset-x-0 before:bottom-0 before:h-[1px] before:bg-[#333]',
                )}
              >
                <Section title="Props" isExpanded={isExpanded} />
                <Section title="State" isExpanded={isExpanded} />
                <Section title="Context" isExpanded={isExpanded} />
              </div>
            )
          }
        </div>
      </div>
    </>
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
        <i className="text-[#A855F7] truncate">{componentName}</i>
      </span>
    </span>
  );
};

const WhatsChangedHeader = memo<{
  refSticky?:
  | ReturnType<typeof useMergedRefs<HTMLElement>>
  | ((node: HTMLElement | null) => void);
  isSticky?: boolean;
  calculateStickyTop: (removeSticky?: boolean) => void;
  isExpanded: boolean;
  shouldShowChanges: boolean;
  setIsExpanded: Setter<boolean>;
}>(
  ({
    refSticky,
    isSticky,
    calculateStickyTop,
    isExpanded,
    shouldShowChanges,
    setIsExpanded,
  }) => {
    const refProps = useRef<HTMLDivElement>(null);
    const refState = useRef<HTMLDivElement>(null);
    const refContext = useRef<HTMLDivElement>(null);

    const refStats = useRef<{
      isPropsChanged: boolean;
      isStateChanged: boolean;
      isContextChanged: boolean;
    }>({
      isPropsChanged: false,
      isStateChanged: false,
      isContextChanged: false,
    });

    useEffect(() => {
      const flash = throttle(() => {
        const flashElements = [];
        if (refProps.current?.dataset.flash === 'true') {
          flashElements.push(refProps.current);
        }
        if (refState.current?.dataset.flash === 'true') {
          flashElements.push(refState.current);
        }
        if (refContext.current?.dataset.flash === 'true') {
          flashElements.push(refContext.current);
        }

        for (const element of flashElements) {
          element.classList.remove('count-flash-white');
          void element.offsetWidth;
          element.classList.add('count-flash-white');
        }
      }, 400);

      const unsubscribe = timelineState.subscribe((state) => {
        if (!refProps.current || !refState.current || !refContext.current) {
          return;
        }

        const { currentIndex, updates } = state;
        const currentUpdate = updates[currentIndex];

        if (!currentUpdate || currentIndex === 0) {
          return;
        };

        flash();

        refStats.current = {
          isPropsChanged: (currentUpdate.props?.changes?.size ?? 0) > 0,
          isStateChanged: (currentUpdate.state?.changes?.size ?? 0) > 0,
          isContextChanged: (currentUpdate.context?.changes?.size ?? 0) > 0,
        };

        if (refProps.current.dataset.flash !== 'true') {
          refProps.current.dataset.flash =
            refStats.current.isPropsChanged.toString();
        }
        if (refState.current.dataset.flash !== 'true') {
          refState.current.dataset.flash =
            refStats.current.isStateChanged.toString();
        }
        if (refContext.current.dataset.flash !== 'true') {
          refContext.current.dataset.flash =
            refStats.current.isContextChanged.toString();
        }
      });

      return unsubscribe;
    }, []);

    const toggleExpanded = useCallback(() => {
      setIsExpanded(state => {
        if (isSticky && isExpanded) {
          return state;
        }
        return !state;
      });
    }, [setIsExpanded, isExpanded, isSticky]);

    const onTransitionStart = useCallback((e: TransitionEvent) => {
      if (e.propertyName === 'max-height') {
        calculateStickyTop(true);
      }
    }, [calculateStickyTop]);

    const onTransitionEnd = useCallback((e: TransitionEvent) => {
      if (e.propertyName === 'max-height') {
        calculateStickyTop(false);
      }
    }, [calculateStickyTop]);


    return (
      <button
        ref={refSticky}
        type="button"
        onClick={toggleExpanded}
        onTransitionStart={onTransitionStart}
        onTransitionEnd={onTransitionEnd}
        className={cn(
          'react-section-header',
          'overflow-hidden',
          'max-h-0',
          'transition-[max-height]',
          {
            'max-h-8': shouldShowChanges,
          },
        )}
      >
        <div
          className={cn(
            'flex-1 react-scan-expandable',
            {
              'react-scan-expanded': shouldShowChanges,
            },
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center whitespace-nowrap">
              <div className="flex items-center gap-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <Icon
                    name="icon-chevron-right"
                    size={12}
                    className={cn({
                      'rotate-90': isExpanded,
                      'rotate-0': isSticky && isExpanded,
                    })}
                  />
                </div>
                What changed?
              </div>

              <div
                className={cn(
                  'ml-auto',
                  'change-scope',
                  'opacity-0',
                  'transition-opacity duration-300 delay-150',
                  {
                    'opacity-100': !isExpanded,
                  },
                )}
              >
                <div ref={refProps}>props</div>
                <div ref={refState}>state</div>
                <div ref={refContext}>context</div>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  },
);

interface SectionProps {
  title: string;
  isExpanded: boolean;
}

const Section = memo(({ title, isExpanded }: SectionProps) => {
  const refFiberInfo = useRef<MinimalFiberInfo | null>(null);
  const refLastUpdated = useRef(new Set<string | number>());
  const refChangesValues = useRef(new Map<string | number, ChangeValues>());
  const refLatestChanges = useRef<Change[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);

  const [expandedFns, setExpandedFns] = useState(new Set<string>());
  const [expandedEntries, setExpandedEntries] = useState(new Set<string>());

  useEffect(() => {
    const unsubscribe = timelineState.subscribe((state) => {
      const { currentIndex, updates } = state;
      const currentUpdate = currentIndex >= 0 ? updates[currentIndex] : null;
      const prevUpdate = currentIndex > 0 ? updates[currentIndex - 1] : null;
      const currentData = currentUpdate?.[title.toLowerCase() as SectionType];
      const prevData = prevUpdate?.[title.toLowerCase() as SectionType];

      if (!currentData) {
        return;
      }

      refFiberInfo.current = currentUpdate?.fiberInfo;
      refLastUpdated.current.clear();

      const changesMap = new Map<string | number, Change>(
        refLatestChanges.current.map((c) => [c.name, c]),
      );

      for (const { name, value } of currentData.current) {
        const currentCount = currentData.changesCounts?.get(name) ?? 0;
        const prevCount = prevData?.changesCounts?.get(name) ?? 0;
        const count = Math.max(currentCount, prevCount);

        const prevValue = prevData?.current.find(
          (p) => p.name === name,
        )?.value;

        const hasValueChange = !isEqual(value, prevValue);

        if (count > 0 || hasValueChange) {
          const { value: safePrevValue, error: prevError } =
            safeGetValue(prevValue);
          const { value: safeCurrValue, error: currError } =
            safeGetValue(value);
          const diff = getObjectDiff(safePrevValue, safeCurrValue);

          refChangesValues.current.set(name, {
            name,
            prevValue,
            currValue: value,
            prevError,
            currError,
            diff,
            isFunction: typeof value === 'function',
          });

          const change = { name, value, prevValue, count };
          const existingChange = changesMap.get(name);

          if (
            !existingChange ||
            existingChange.count !== count ||
            !isEqual(existingChange.value, value)
          ) {
            refLastUpdated.current.add(name);
          }

          changesMap.set(name, change);
        }
      }

      refLatestChanges.current = Array.from(changesMap.values());
      setChanges(refLatestChanges.current);
    });

    return unsubscribe;
  }, [title]);

  const handleExpandEntry = useCallback((entryKey: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(String(entryKey))) {
        next.delete(String(entryKey));
      } else {
        next.add(String(entryKey));
      }
      return next;
    });
  }, []);

  const memoizedRenderStateName = useCallback((name: string): ReactNode => {
    if (!refFiberInfo.current) return name;
    return renderStateName(name, refFiberInfo.current.displayName);
  }, []);

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="pb-2">
      <div className="text-xs text-[#888] mb-1.5">{title}</div>
      <div className="flex flex-col gap-2">
        {
          changes.map((change) => {
            const isEntryExpanded = expandedEntries.has(String(change.name));
            const values = refChangesValues.current.get(change.name);
            if (!values) return null;

            return (
              <div key={change.name}>
                <button
                  type="button"
                  onClick={() => handleExpandEntry(String(change.name))}
                  className={cn(
                    'relative',
                    'flex items-center gap-2',
                    'w-full p-0 cursor-pointer text-white text-xs',
                  )}
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
                    <div className="whitespace-nowrap break-words text-left font-medium flex items-center gap-x-1.5">
                      {memoizedRenderStateName(String(change.name))}
                      <CountBadge
                        forceFlash={isExpanded && refLastUpdated.current.has(change.name)}
                        count={change.count}
                        isFunction={values.isFunction}
                        showWarning={values.diff.changes.length === 0}
                      />
                    </div>
                  </div>
                </button>
                <div
                  className={cn(
                    'react-scan-expandable',
                    'overflow-hidden',
                    {
                      'react-scan-expanded': isEntryExpanded,
                    },
                  )}
                >
                  <div className="pl-3 text-xs font-mono border-l-1 border-[#333] overflow-hidden">
                    <div className="flex flex-col gap-0.5">
                      {
                        values.prevError || values.currError
                          ? (
                            <AccessError
                              currError={values.currError}
                              prevError={values.prevError}
                            />
                          )
                          : values.diff.changes.length > 0
                            ? (
                              <DiffChange
                                title={title}
                                change={change}
                                diff={values.diff}
                                expandedFns={expandedFns}
                                renderName={memoizedRenderStateName}
                                setExpandedFns={setExpandedFns}
                              />
                            )
                            : (
                              <ReferenceOnlyChange
                                currValue={values.currValue}
                                entryKey={change.name}
                                expandedFns={expandedFns}
                                prevValue={values.prevValue}
                                setExpandedFns={setExpandedFns}
                              />
                            )
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
});

type SectionType = 'props' | 'state' | 'context';

type ChangeValues = {
  name: string | number;
  prevValue: unknown;
  currValue: unknown;
  prevError?: string;
  currError?: string;
  diff: {
    changes: {
      path: string[];
      prevValue: unknown;
      currentValue: unknown;
    }[];
  };
  isFunction: boolean;
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
  change: Change;
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

    let path: string | undefined;

    if (title === 'Props') {
      path =
        diffChange.path.length > 0
          ? `${renderName(String(change.name))}.${formatPath(diffChange.path)}`
          : undefined;
    }
    if (title === 'State' && diffChange.path.length > 0) {
      path = `state.${formatPath(diffChange.path)}`;
    }

    if (!path) {
      path = formatPath(diffChange.path);
    }

    return (
      <div
        key={`${path}-${change.name}-${i}`}
        className={cn('flex flex-col gap-y-1', {
          'mb-4': i < diff.changes.length - 1,
        })}
      >
        {path && <div className="text-[#666] text-[10px]">{path}</div>}
        <button
          type="button"
          className={cn(
            'group',
            'flex items-start',
            'py-[3px] px-1.5',
            'text-left text-[#f87171] bg-[#2a1515]',
            'rounded-[2px]',
            'overflow-hidden break-all',
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
          <span className="flex-1 whitespace-nowrap font-mono">
            {prevDiffError ? (
              <span className="italic text-[#f87171]">{prevDiffError}</span>
            ) : isFunction ? (
              <div className="flex gap-1 items-start flex-col">
                <div className="flex gap-1 items-start w-full">
                  <span className="flex-1 max-h-40">
                    {formatFunctionPreview(
                      prevDiffValue as (...args: unknown[]) => unknown,
                      expandedFns.has(`${formatPath(diffChange.path)}-prev`),
                    )}
                  </span>
                  {typeof prevDiffValue === 'function' && (
                    <CopyToClipboard
                      text={prevDiffValue.toString()}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
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
            'group',
            'flex items-start',
            'py-[3px] px-1.5',
            'text-left text-[#4ade80] bg-[#1a2a1a]',
            'rounded-[2px]',
            'overflow-hidden break-all',
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
                      className="opacity-0 transition-opacity group-hover:opacity-100"
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
  entryKey: string | number;
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
            expanded={expandedFns.has(`${String(entryKey)}-prev`)}
            onToggle={() => {
              const key = `${String(entryKey)}-prev`;
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
            expanded={expandedFns.has(`${String(entryKey)}-current`)}
            onToggle={() => {
              const key = `${String(entryKey)}-current`;
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
  forceFlash,
  isFunction,
  showWarning,
}: {
  count: number;
  forceFlash: boolean;
  isFunction: boolean;
  showWarning: boolean;
}) => {
  const refTimer = useRef<TTimer>();
  const refIsFirstRender = useRef(true);
  const refBadge = useRef<HTMLDivElement>(null);
  const refPrevCount = useRef(count);

  useEffect(() => {
    const element = refBadge.current;
    if (!element || refPrevCount.current === count) {
      return;
    }

    element.classList.remove('count-flash');
    void element.offsetWidth;
    element.classList.add('count-flash');

    refPrevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (refIsFirstRender.current) {
      refIsFirstRender.current = false;
      return;
    }

    if (forceFlash) {
      refTimer.current = setTimeout(() => {
        refBadge.current?.classList.add('count-flash-white');
        refTimer.current = setTimeout(() => {
          refBadge.current?.classList.remove('count-flash-white');
        }, 300);
      }, 500);
    }
    return () => {
      clearTimeout(refTimer.current);
    };
  }, [forceFlash]);

  return (
    <div ref={refBadge} className="count-badge">
      {showWarning && (
        <Icon
          name="icon-triangle-alert"
          className="text-yellow-500 mb-px"
          size={14}
        />
      )}
      {isFunction && (
        <Icon name="icon-function" className="text-[#A855F7] mb-px" size={14} />
      )}
      x{count}
    </div>
  );
};
