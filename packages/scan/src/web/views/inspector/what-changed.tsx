import {
  For,
  Index,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  type JSX,
  type Setter,
} from "solid-js";
import { CopyToClipboard } from "../../components/copy-to-clipboard";
import { Icon } from "../../components/icon";
import { cn, throttle } from "../../utils/helpers";
import { DiffValueView } from "./diff-value";
import { getTimelineState } from "./states";
import {
  AggregatedChanges,
  formatFunctionPreview,
  formatPath,
  getObjectDiff,
  safeGetValue,
} from "./utils";
import {
  calculateTotalChanges,
  createInspectedFiberChangeStore,
} from "./whats-changed/use-change-store";
import { getDisplayName, getType } from "bippy";
import { getInspectState } from "../../../core/native-state";

export const WhatChanged = () => {
  const [isExpanded, setIsExpanded] = createSignal(true);
  const aggregatedChanges = createInspectedFiberChangeStore();

  const [hasInitialized, setHasInitialized] = createSignal(false);
  const hasAnyChanges = createMemo(() => calculateTotalChanges(aggregatedChanges()) > 0);
  createEffect(() => {
    if (!hasInitialized() && hasAnyChanges()) {
      const timer = setTimeout(() => {
        setHasInitialized(true);
        requestAnimationFrame(() => {
          setIsExpanded(true);
        });
      }, 0);
      onCleanup(() => clearTimeout(timer));
    }
  });

  const initializedContextChanges = createMemo(
    () =>
      new Map(
        Array.from(aggregatedChanges().contextChanges.entries()).flatMap(([key, value]) =>
          value.kind === "initialized" ? [[key, value.changes]] : [],
        ),
      ),
  );

  const fiber = createMemo(() => {
    const inspectState = getInspectState();
    return inspectState.kind === "focused" ? inspectState.fiber : null;
  });

  return (
    <Show when={fiber()}>
      {(currentFiber) => (
        <>
          <WhatsChangedHeader />

          <div class="overflow-hidden h-full flex flex-col gap-y-2">
            <div class="flex flex-col gap-2 px-3 pt-2">
              <span class="text-sm font-medium text-[#888]">
                Why did <span class="text-[#A855F7]">{getDisplayName(currentFiber())}</span> render?
              </span>
              <Show when={!hasAnyChanges()}>
                <div class="text-sm text-[#737373] bg-[#1E1E1E] rounded-md p-4 flex flex-col gap-4">
                  <div>No changes detected since selecting</div>
                  <div>
                    The props, state, and context changes within your component will be reported
                    here
                  </div>
                </div>
              </Show>
            </div>
            <div class={cn("flex flex-col gap-y-2 pl-3 relative overflow-y-auto h-full")}>
              <Section
                changes={aggregatedChanges().propsChanges}
                title="Changed Props"
                isExpanded={isExpanded()}
              />
              <Section
                renderName={(name) =>
                  renderStateName(
                    name,
                    getDisplayName(getType(currentFiber())) ?? "Unknown Component",
                  )
                }
                changes={aggregatedChanges().stateChanges}
                title="Changed State"
                isExpanded={isExpanded()}
              />
              <Section
                changes={initializedContextChanges()}
                title="Changed Context"
                isExpanded={isExpanded()}
              />
            </div>
          </div>
        </>
      )}
    </Show>
  );
};

const renderStateName = (key: string, componentName: string) => {
  if (Number.isNaN(Number(key))) {
    return key;
  }

  const n = Number.parseInt(key);
  const getOrdinalSuffix = (num: number) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return "th";
    }
    switch (lastDigit) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <span class="truncate">
      <span class="text-white">
        {n}
        {getOrdinalSuffix(n)} hook{" "}
      </span>
      <span style={{ color: "#666" }}>
        called in <i class="text-[#A855F7] truncate">{componentName}</i>
      </span>
    </span>
  );
};

const WhatsChangedHeader = () => {
  let propsElement: HTMLDivElement | undefined;
  let stateElement: HTMLDivElement | undefined;
  let contextElement: HTMLDivElement | undefined;

  let stats: {
    isPropsChanged: boolean;
    isStateChanged: boolean;
    isContextChanged: boolean;
  } = {
    isPropsChanged: false,
    isStateChanged: false,
    isContextChanged: false,
  };

  const flash = throttle(() => {
    const flashElements = [];
    if (propsElement?.dataset.flash === "true") {
      flashElements.push(propsElement);
    }
    if (stateElement?.dataset.flash === "true") {
      flashElements.push(stateElement);
    }
    if (contextElement?.dataset.flash === "true") {
      flashElements.push(contextElement);
    }

    for (const element of flashElements) {
      element.classList.remove("count-flash-white");
      void element.offsetWidth;
      element.classList.add("count-flash-white");
    }
  }, 400);

  createEffect(
    on(
      getTimelineState,
      (state) => {
        if (!propsElement || !stateElement || !contextElement) {
          return;
        }

        const { currentIndex, updates } = state;
        const currentUpdate = updates[currentIndex];

        if (!currentUpdate || currentIndex === 0) {
          return;
        }

        flash();

        stats = {
          isPropsChanged: (currentUpdate.props?.changes?.size ?? 0) > 0,
          isStateChanged: (currentUpdate.state?.changes?.size ?? 0) > 0,
          isContextChanged: (currentUpdate.context?.changes?.size ?? 0) > 0,
        };

        if (propsElement.dataset.flash !== "true") {
          propsElement.dataset.flash = stats.isPropsChanged.toString();
        }
        if (stateElement.dataset.flash !== "true") {
          stateElement.dataset.flash = stats.isStateChanged.toString();
        }
        if (contextElement.dataset.flash !== "true") {
          contextElement.dataset.flash = stats.isContextChanged.toString();
        }
      },
      { defer: true },
    ),
  );

  return (
    <button
      type="button"
      class={cn("react-section-header", "overflow-hidden", "max-h-0", "transition-[max-height]")}
    >
      <div class={cn("flex-1 react-scan-expandable")}>
        <div class="overflow-hidden">
          <div class="flex items-center whitespace-nowrap">
            <div class="flex items-center gap-x-2">What changed?</div>

            <div class={cn("ml-auto", "change-scope", "transition-opacity duration-300 delay-150")}>
              <div ref={propsElement}>props</div>
              <div ref={stateElement}>state</div>
              <div ref={contextElement}>context</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

interface SectionProps {
  title: string;
  isExpanded: boolean;
  // oxlint-disable-next-line typescript/no-explicit-any
  changes: Map<any, AggregatedChanges>;
  renderName?: (name: string) => JSX.Element;
}
const identity = <T,>(x: T) => x;
const Section = (props: SectionProps) => {
  const [expandedFunctions, setExpandedFunctions] = createSignal(new Set<string>());
  const [expandedEntries, setExpandedEntries] = createSignal(new Set<string>());
  const entryKeys = createMemo(() => Array.from(props.changes.keys()));
  const renderName = (name: string) => (props.renderName ?? identity)(name);

  return (
    <Show when={props.changes.size > 0}>
      <div>
        <div class="text-xs text-[#888] mb-1.5">{props.title}</div>
        <div class="flex flex-col gap-2">
          <For each={entryKeys()}>
            {(entryKey) => {
              const isEntryExpanded = () => expandedEntries().has(String(entryKey));
              const change = createMemo(() => props.changes.get(entryKey));
              const previousResult = createMemo(() => safeGetValue(change()?.previousValue));
              const currentResult = createMemo(() => safeGetValue(change()?.currentValue));
              const diff = createMemo(() =>
                getObjectDiff(previousResult().value, currentResult().value),
              );

              return (
                <Show when={change()}>
                  {(currentChange) => (
                    <div>
                      <button
                        onClick={() => {
                          setExpandedEntries((previousEntries) => {
                            const nextEntries = new Set(previousEntries);
                            if (nextEntries.has(String(entryKey))) {
                              nextEntries.delete(String(entryKey));
                            } else {
                              nextEntries.add(String(entryKey));
                            }
                            return nextEntries;
                          });
                        }}
                        class="flex items-center gap-2 w-full bg-transparent border-none p-0 cursor-pointer text-white text-xs"
                      >
                        <div class="flex items-center gap-1.5 flex-1">
                          <Icon
                            name="icon-chevron-right"
                            size={12}
                            class={cn(
                              "text-[#666] transition-transform duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                              {
                                "rotate-90": isEntryExpanded(),
                              },
                            )}
                          />
                          <div class="whitespace-pre-wrap break-words text-left font-medium flex items-center gap-x-1.5">
                            {renderName(currentChange().name)}

                            <CountBadge
                              count={currentChange().count}
                              isFunction={typeof currentChange().currentValue === "function"}
                              showWarning={diff().changes.length === 0}
                              forceFlash
                              // showFlame={diff.changes.length === 0}
                              // showFn={typeof change.currentValue === 'function'}
                            />
                          </div>
                        </div>
                      </button>
                      <div
                        class={cn("react-scan-expandable", {
                          "react-scan-expanded": isEntryExpanded(),
                        })}
                      >
                        <div class="pl-3 text-xs font-mono border-l-1 border-[#333]">
                          <div class="flex flex-col gap-0.5">
                            <Show
                              when={!previousResult().error && !currentResult().error}
                              fallback={
                                <AccessError
                                  currError={currentResult().error}
                                  prevError={previousResult().error}
                                />
                              }
                            >
                              <Show
                                when={diff().changes.length > 0}
                                fallback={
                                  <ReferenceOnlyChange
                                    currValue={currentResult().value}
                                    entryKey={entryKey}
                                    expandedFunctions={expandedFunctions()}
                                    prevValue={previousResult().value}
                                    setExpandedFunctions={setExpandedFunctions}
                                  />
                                }
                              >
                                <DiffChange
                                  change={currentChange()}
                                  diff={diff()}
                                  expandedFunctions={expandedFunctions()}
                                  renderName={renderName}
                                  setExpandedFunctions={setExpandedFunctions}
                                  title={props.title}
                                />
                              </Show>
                            </Show>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};

interface AccessErrorProps {
  prevError?: string;
  currError?: string;
}

const AccessError = (props: AccessErrorProps) => {
  return (
    <>
      <Show when={props.prevError}>
        <div class="text-[#f87171] bg-[#2a1515] pr-1.5 py-[3px] rounded italic">
          {props.prevError}
        </div>
      </Show>
      <Show when={props.currError}>
        <div class="text-[#4ade80] bg-[#1a2a1a] pr-1.5 py-[3px] rounded italic mt-0.5">
          {props.currError}
        </div>
      </Show>
    </>
  );
};

interface DiffChangeProps {
  diff: {
    changes: Array<{
      path: string[];
      prevValue: unknown;
      currentValue: unknown;
    }>;
  };
  title: string;
  renderName: (name: string) => JSX.Element;
  change: { name: string };
  expandedFunctions: Set<string>;
  setExpandedFunctions: Setter<Set<string>>;
}

const DiffChange = (props: DiffChangeProps) => {
  return (
    <Index each={props.diff.changes}>
      {(diffChange, index) => {
        const previousResult = createMemo(() => safeGetValue(diffChange().prevValue));
        const currentResult = createMemo(() => safeGetValue(diffChange().currentValue));
        const isFunction = () =>
          typeof previousResult().value === "function" ||
          typeof currentResult().value === "function";
        const toggleExpandedFunction = (variant: "prev" | "current") => {
          const functionKey = `${formatPath(diffChange().path)}-${variant}`;
          props.setExpandedFunctions((previousFunctions) => {
            const nextFunctions = new Set(previousFunctions);
            if (nextFunctions.has(functionKey)) {
              nextFunctions.delete(functionKey);
            } else {
              nextFunctions.add(functionKey);
            }
            return nextFunctions;
          });
        };
        const handleFunctionKeyDown = (variant: "prev" | "current", event: KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggleExpandedFunction(variant);
        };

        const path = () => {
          if (props.title === "Props") {
            return diffChange().path.length > 0
              ? `${props.renderName(String(props.change.name))}.${formatPath(diffChange().path)}`
              : undefined;
          }
          if (props.title === "State" && diffChange().path.length > 0) {
            return `state.${formatPath(diffChange().path)}`;
          }
          return formatPath(diffChange().path);
        };

        return (
          <div class={cn("flex flex-col gap-y-1", index < props.diff.changes.length - 1 && "mb-4")}>
            <Show when={path()}>
              <div class="text-[#666] text-[10px]">{path()}</div>
            </Show>
            <div
              role={isFunction() ? "button" : undefined}
              tabIndex={isFunction() ? 0 : undefined}
              class={cn(
                "group",
                "flex items-start",
                "py-[3px] px-1.5",
                "text-left text-[#f87171] bg-[#2a1515]",
                "rounded",
                "overflow-hidden break-all",
                isFunction() && "cursor-pointer",
              )}
              onClick={isFunction() ? () => toggleExpandedFunction("prev") : undefined}
              onKeyDown={isFunction() ? (event) => handleFunctionKeyDown("prev", event) : undefined}
            >
              <span class="w-3 flex items-center justify-center opacity-50">-</span>
              <span class="flex-1 whitespace-nowrap font-mono">
                {previousResult().error ? (
                  <span class="italic text-[#f87171]">{previousResult().error}</span>
                ) : isFunction() ? (
                  <div class="flex gap-1 items-start flex-col">
                    <div class="flex gap-1 items-start w-full">
                      <span class="flex-1 max-h-40">
                        {formatFunctionPreview(
                          previousResult().value as (...args: unknown[]) => unknown,
                          props.expandedFunctions.has(`${formatPath(diffChange().path)}-prev`),
                        )}
                      </span>
                      {typeof previousResult().value === "function" && (
                        <CopyToClipboard
                          text={String(previousResult().value)}
                          class="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                        </CopyToClipboard>
                      )}
                    </div>
                    {previousResult().value?.toString() === currentResult().value?.toString() && (
                      <div class="text-[10px] text-[#666] italic">Function reference changed</div>
                    )}
                  </div>
                ) : (
                  <DiffValueView
                    value={previousResult().value}
                    expanded={props.expandedFunctions.has(`${formatPath(diffChange().path)}-prev`)}
                    onToggle={() => {
                      const key = `${formatPath(diffChange().path)}-prev`;
                      props.setExpandedFunctions((previousFunctions) => {
                        const nextFunctions = new Set(previousFunctions);
                        if (nextFunctions.has(key)) {
                          nextFunctions.delete(key);
                        } else {
                          nextFunctions.add(key);
                        }
                        return nextFunctions;
                      });
                    }}
                    isNegative={true}
                  />
                )}
              </span>
            </div>
            <div
              role={isFunction() ? "button" : undefined}
              tabIndex={isFunction() ? 0 : undefined}
              class={cn(
                "group",
                "flex items-start",
                "py-[3px] px-1.5",
                "text-left text-[#4ade80] bg-[#1a2a1a]",
                "rounded",
                "overflow-hidden break-all",
                isFunction() && "cursor-pointer",
              )}
              onClick={isFunction() ? () => toggleExpandedFunction("current") : undefined}
              onKeyDown={
                isFunction() ? (event) => handleFunctionKeyDown("current", event) : undefined
              }
            >
              <span class="w-3 flex items-center justify-center opacity-50">+</span>
              <span class="flex-1 whitespace-pre-wrap font-mono">
                {currentResult().error ? (
                  <span class="italic text-[#4ade80]">{currentResult().error}</span>
                ) : isFunction() ? (
                  <div class="flex gap-1 items-start flex-col">
                    <div class="flex gap-1 items-start w-full">
                      <span class="flex-1">
                        {formatFunctionPreview(
                          currentResult().value as (...args: unknown[]) => unknown,
                          props.expandedFunctions.has(`${formatPath(diffChange().path)}-current`),
                        )}
                      </span>
                      {typeof currentResult().value === "function" && (
                        <CopyToClipboard
                          text={String(currentResult().value)}
                          class="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                        </CopyToClipboard>
                      )}
                    </div>
                    {previousResult().value?.toString() === currentResult().value?.toString() && (
                      <div class="text-[10px] text-[#666] italic">Function reference changed</div>
                    )}
                  </div>
                ) : (
                  <DiffValueView
                    value={currentResult().value}
                    expanded={props.expandedFunctions.has(
                      `${formatPath(diffChange().path)}-current`,
                    )}
                    onToggle={() => {
                      const key = `${formatPath(diffChange().path)}-current`;
                      props.setExpandedFunctions((previousFunctions) => {
                        const nextFunctions = new Set(previousFunctions);
                        if (nextFunctions.has(key)) {
                          nextFunctions.delete(key);
                        } else {
                          nextFunctions.add(key);
                        }
                        return nextFunctions;
                      });
                    }}
                    isNegative={false}
                  />
                )}
              </span>
            </div>
          </div>
        );
      }}
    </Index>
  );
};

interface ReferenceOnlyChangeProps {
  prevValue: unknown;
  currValue: unknown;
  entryKey: string | number;
  expandedFunctions: Set<string>;
  setExpandedFunctions: Setter<Set<string>>;
}

const ReferenceOnlyChange = (props: ReferenceOnlyChangeProps) => {
  return (
    <>
      <div class="group flex gap-0.5 items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded">
        <span class="w-3 flex items-center justify-center opacity-50">-</span>
        <span class="flex-1 overflow-hidden whitespace-pre-wrap font-mono">
          <DiffValueView
            value={props.prevValue}
            expanded={props.expandedFunctions.has(`${String(props.entryKey)}-prev`)}
            onToggle={() => {
              const key = `${String(props.entryKey)}-prev`;
              props.setExpandedFunctions((previousFunctions) => {
                const nextFunctions = new Set(previousFunctions);
                if (nextFunctions.has(key)) {
                  nextFunctions.delete(key);
                } else {
                  nextFunctions.add(key);
                }
                return nextFunctions;
              });
            }}
            isNegative={true}
          />
        </span>
      </div>
      <div class="group flex gap-0.5 items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded mt-0.5">
        <span class="w-3 flex items-center justify-center opacity-50">+</span>
        <span class="flex-1 overflow-hidden whitespace-pre-wrap font-mono">
          <DiffValueView
            value={props.currValue}
            expanded={props.expandedFunctions.has(`${String(props.entryKey)}-current`)}
            onToggle={() => {
              const key = `${String(props.entryKey)}-current`;
              props.setExpandedFunctions((previousFunctions) => {
                const nextFunctions = new Set(previousFunctions);
                if (nextFunctions.has(key)) {
                  nextFunctions.delete(key);
                } else {
                  nextFunctions.add(key);
                }
                return nextFunctions;
              });
            }}
            isNegative={false}
          />
        </span>
      </div>
      <Show when={typeof props.currValue === "object" && props.currValue !== null}>
        <div class="text-[#666] text-[10px] italic mt-1 flex items-center gap-x-1">
          <Icon name="icon-triangle-alert" class="text-yellow-500 mb-px" size={14} />
          <span>Reference changed but objects are structurally the same</span>
        </div>
      </Show>
    </>
  );
};

interface CountBadgeProps {
  count: number;
  forceFlash: boolean;
  isFunction: boolean;
  showWarning: boolean;
}

const CountBadge = (props: CountBadgeProps) => {
  let isFirstRender = true;
  let badgeElement: HTMLDivElement | undefined;
  let previousCount = props.count;

  createEffect(() => {
    const count = props.count;
    const element = badgeElement;
    if (!element || previousCount === count) {
      return;
    }

    element.classList.remove("count-flash");
    void element.offsetWidth;
    element.classList.add("count-flash");

    previousCount = count;
  });

  createEffect(() => {
    const shouldForceFlash = props.forceFlash;
    if (isFirstRender) {
      isFirstRender = false;
      return;
    }

    if (shouldForceFlash) {
      let timer = setTimeout(() => {
        badgeElement?.classList.add("count-flash-white");
        timer = setTimeout(() => {
          badgeElement?.classList.remove("count-flash-white");
        }, 300);
      }, 500);
      onCleanup(() => {
        clearTimeout(timer);
      });
    }
  });

  return (
    <div ref={badgeElement} class="count-badge">
      <Show when={props.showWarning}>
        <Icon name="icon-triangle-alert" class="text-yellow-500 mb-px" size={14} />
      </Show>
      <Show when={props.isFunction}>
        <Icon name="icon-function" class="text-[#A855F7] mb-px" size={14} />
      </Show>
      x{props.count}
    </div>
  );
};
