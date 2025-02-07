import { type Fiber, getDisplayName } from 'bippy';
import { getCompositeComponentFromElement } from '~web/views/inspector/utils';
import { Store } from '..';
import type {
  PerformanceInteraction,
  PerformanceInteractionEntry,
} from './types';

interface PathFilters {
  skipProviders: boolean;
  skipHocs: boolean;
  skipContainers: boolean;
  skipMinified: boolean;
  skipUtilities: boolean;
  skipBoundaries: boolean;
}

const DEFAULT_FILTERS: PathFilters = {
  skipProviders: true,
  skipHocs: true,
  skipContainers: true,
  skipMinified: true,
  skipUtilities: true,
  skipBoundaries: true,
};

const FILTER_PATTERNS = {
  providers: [/Provider$/, /^Provider$/, /^Context$/],
  hocs: [/^with[A-Z]/, /^forward(?:Ref)?$/i, /^Forward(?:Ref)?\(/],
  containers: [/^(?:App)?Container$/, /^Root$/, /^ReactDev/],
  utilities: [
    /^Fragment$/,
    /^Suspense$/,
    /^ErrorBoundary$/,
    /^Portal$/,
    /^Consumer$/,
    /^Layout$/,
    /^Router/,
    /^Hydration/,
  ],
  boundaries: [/^Boundary$/, /Boundary$/, /^Provider$/, /Provider$/],
};

const shouldIncludeInPath = (
  name: string,
  filters: PathFilters = DEFAULT_FILTERS,
): boolean => {
  const patternsToCheck: Array<RegExp> = [];
  if (filters.skipProviders) patternsToCheck.push(...FILTER_PATTERNS.providers);
  if (filters.skipHocs) patternsToCheck.push(...FILTER_PATTERNS.hocs);
  if (filters.skipContainers)
    patternsToCheck.push(...FILTER_PATTERNS.containers);
  if (filters.skipUtilities) patternsToCheck.push(...FILTER_PATTERNS.utilities);
  if (filters.skipBoundaries)
    patternsToCheck.push(...FILTER_PATTERNS.boundaries);
  return !patternsToCheck.some((pattern) => pattern.test(name));
};

const minifiedPatterns = [
  /^[a-z]$/, // Single lowercase letter
  /^[a-z][0-9]$/, // Lowercase letter followed by number
  /^_+$/, // Just underscores
  /^[A-Za-z][_$]$/, // Letter followed by underscore or dollar
  /^[a-z]{1,2}$/, // 1-2 lowercase letters
];

const isMinified = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return true;
  }

  for (let i = 0; i < minifiedPatterns.length; i++) {
    if (minifiedPatterns[i].test(name)) return true;
  }

  const hasNoVowels = !/[aeiou]/i.test(name);
  const hasMostlyNumbers = (name.match(/\d/g)?.length ?? 0) > name.length / 2;
  const isSingleWordLowerCase = /^[a-z]+$/.test(name);
  const hasRandomLookingChars = /[$_]{2,}/.test(name);

  // If more than 2 of the following are true, we consider the name minified
  return (
    Number(hasNoVowels) +
      Number(hasMostlyNumbers) +
      Number(isSingleWordLowerCase) +
      Number(hasRandomLookingChars) >=
    2
  );
};

export const getInteractionPath = (
  initialFiber: Fiber | null,
  filters: PathFilters = DEFAULT_FILTERS,
): Array<string> => {
  if (!initialFiber) return [];

  const currentName = getDisplayName(initialFiber.type);
  if (!currentName) return [];

  const stack = new Array<string>();
  let fiber = initialFiber;
  while (fiber.return) {
    const name = getCleanComponentName(fiber.type);
    if (name && !isMinified(name) && shouldIncludeInPath(name, filters)) {
      stack.push(name);
    }
    fiber = fiber.return;
  }
  const fullPath = new Array<string>(stack.length);
  for (let i = 0; i < stack.length; i++) {
    fullPath[i] = stack[stack.length - i - 1];
  }
  return fullPath;
};

let currentMouseOver: Element;

interface FiberType {
  displayName?: string;
  name?: string;
  [key: string]: unknown;
}

const getCleanComponentName = (component: FiberType): string => {
  const name = getDisplayName(component);
  if (!name) return '';

  return name.replace(
    /^(?:Memo|Forward(?:Ref)?|With.*?)\((?<inner>.*?)\)$/,
    '$<inner>',
  );
};

// For future use, normalization of paths happens on server side now using path property of interaction
// const _normalizePath = (path: Array<string>): string => {
// 	const cleaned = path.filter(Boolean);
// 	const deduped = cleaned.filter((name, i) => name !== cleaned[i - 1]);
// 	return deduped.join('.');
// };

const handleMouseover = (event: Event) => {
  if (!(event.target instanceof Element)) return;
  currentMouseOver = event.target;
};

const getFirstNamedAncestorCompositeFiber = (element: Element) => {
  let curr: Element | null = element;
  let parentCompositeFiber: Fiber | null = null;
  while (!parentCompositeFiber && curr.parentElement) {
    curr = curr.parentElement;

    const { parentCompositeFiber: fiber } =
      getCompositeComponentFromElement(curr);

    if (!fiber) {
      continue;
    }
    if (getDisplayName(fiber.type)) {
      parentCompositeFiber = fiber;
    }
  }
  return parentCompositeFiber;
};

let unsubscribeTrackVisibilityChange: (() => void) | undefined;
// fixme: compress me if this stays here for bad interaction time checks
let lastVisibilityHiddenAt: number | 'never-hidden' = 'never-hidden';

const trackVisibilityChange = () => {
  unsubscribeTrackVisibilityChange?.();
  const onVisibilityChange = () => {
    if (document.hidden) {
      lastVisibilityHiddenAt = Date.now();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  unsubscribeTrackVisibilityChange = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
};

// todo: update monitoring api to expose filters for component names
export function initPerformanceMonitoring(options?: Partial<PathFilters>) {
  const filters = { ...DEFAULT_FILTERS, ...options };
  const monitor = Store.monitor.value;
  if (!monitor) return;

  document.addEventListener('mouseover', handleMouseover);
  const disconnectPerformanceListener = setupPerformanceListener((entry) => {
    const target =
      entry.target ?? (entry.type === 'pointer' ? currentMouseOver : null);
    if (!target) {
      // most likely an invariant that we should log if its violated
      return;
    }
    const parentCompositeFiber = getFirstNamedAncestorCompositeFiber(target);
    if (!parentCompositeFiber) {
      return;
    }
    const displayName = getDisplayName(parentCompositeFiber.type);
    if (!displayName || isMinified(displayName)) {
      // invariant, we know its named based on getFirstNamedAncestorCompositeFiber implementation
      return;
    }

    const path = getInteractionPath(parentCompositeFiber, filters);

    monitor.interactions.push({
      componentName: displayName,
      componentPath: path,
      performanceEntry: entry,
      components: new Map(),
      url: window.location.toString(),
      route:
        Store.monitor.value?.route ?? new URL(window.location.href).pathname,
      commit: Store.monitor.value?.commit ?? null,
      branch: Store.monitor.value?.branch ?? null,
      uniqueInteractionId: entry.id,
    });
  });

  return () => {
    disconnectPerformanceListener();
    document.removeEventListener('mouseover', handleMouseover);
  };
}

const getInteractionType = (
  eventName: string,
): 'pointer' | 'keyboard' | null => {
  if (['pointerdown', 'pointerup', 'click'].includes(eventName)) {
    return 'pointer';
  }
  if (['keydown', 'keyup'].includes(eventName)) {
    return 'keyboard';
  }
  return null;
};

const setupPerformanceListener = (
  onEntry: (interaction: PerformanceInteraction) => void,
) => {
  trackVisibilityChange();
  const longestInteractionMap = new Map<string, PerformanceInteraction>();
  const interactionTargetMap = new Map<string, Element>();

  const processInteractionEntry = (entry: PerformanceInteractionEntry) => {
    if (!(entry.interactionId || entry.entryType === 'first-input')) return;

    if (
      entry.interactionId &&
      entry.target &&
      !interactionTargetMap.has(entry.interactionId)
    ) {
      interactionTargetMap.set(entry.interactionId, entry.target);
    }

    const existingInteraction = longestInteractionMap.get(entry.interactionId);

    if (existingInteraction) {
      if (entry.duration > existingInteraction.latency) {
        existingInteraction.entries = [entry];
        existingInteraction.latency = entry.duration;
      } else if (
        entry.duration === existingInteraction.latency &&
        entry.startTime === existingInteraction.entries[0].startTime
      ) {
        existingInteraction.entries.push(entry);
      }
    } else {
      const interactionType = getInteractionType(entry.name);
      if (!interactionType) return;

      const interaction: PerformanceInteraction = {
        id: entry.interactionId,
        latency: entry.duration,
        entries: [entry],
        target: entry.target,
        type: interactionType,
        startTime: entry.startTime,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        duration: entry.duration,
        inputDelay: entry.processingStart - entry.startTime,
        processingDuration: entry.processingEnd - entry.processingStart,
        presentationDelay:
          entry.duration - (entry.processingEnd - entry.startTime),
        timestamp: Date.now(),
        timeSinceTabInactive:
          lastVisibilityHiddenAt === 'never-hidden'
            ? 'never-hidden'
            : Date.now() - lastVisibilityHiddenAt,
        visibilityState: document.visibilityState,
        timeOrigin: performance.timeOrigin,
        referrer: document.referrer,
      };
      longestInteractionMap.set(interaction.id, interaction);

      onEntry(interaction);
    }
  };

  const po = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0, len = entries.length; i < len; i++) {
      const entry = entries[i];
      processInteractionEntry(entry as PerformanceInteractionEntry);
    }
  });

  try {
    po.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit);
    po.observe({
      type: 'first-input',
      buffered: true,
    });
  } catch {
    /* Should collect error logs*/
  }

  return () => po.disconnect();
};
