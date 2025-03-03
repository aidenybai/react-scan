import {
  type Fiber,
  MemoComponentTag,
  SimpleMemoComponentTag,
  SuspenseComponentTag,
  getDisplayName,
  hasMemoCache,
} from 'bippy';
import { type ClassValue, clsx } from 'clsx';
import { IS_CLIENT } from './constants';

export const cn = (...inputs: Array<ClassValue>): string => {
  return clsx(inputs); // no twMerge for now
};

export const isFirefox =
  /* @__PURE__ */ typeof navigator !== 'undefined' &&
  navigator.userAgent.includes('Firefox');

export const onIdle = (callback: () => void) => {
  if ('scheduler' in globalThis) {
    return globalThis.scheduler.postTask(callback, {
      priority: 'background',
    });
  }
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback);
  }
  return setTimeout(callback, 0);
};

export const throttle = <E>(
  callback: (e?: E) => void,
  delay: number,
): ((e?: E) => void) => {
  let lastCall = 0;
  return (e?: E) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return callback(e);
    }
    return undefined;
  };
};

export const tryOrElse = <T>(fn: () => T, defaultValue: T): T => {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
};

export const readLocalStorage = <T>(storageKey: string): T | null => {
  if (!IS_CLIENT) return null;

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveLocalStorage = <T>(storageKey: string, state: T): void => {
  if (!IS_CLIENT) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
};
export const removeLocalStorage = (storageKey: string): void => {
  if (!IS_CLIENT) return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {}
};

export const toggleMultipleClasses = (
  element: HTMLElement,
  classes: Array<string>,
) => {
  for (const cls of classes) {
    element.classList.toggle(cls);
  }
};

interface WrapperBadge {
  type: 'memo' | 'forwardRef' | 'lazy' | 'suspense' | 'profiler' | 'strict';
  title: string;
  compiler?: boolean;
}

export interface ExtendedDisplayName {
  name: string | null;
  wrappers: Array<string>;
  wrapperTypes: Array<WrapperBadge>;
}

// React internal tags not exported by bippy
const LazyComponentTag = 24;
const ProfilerTag = 12;

export const getExtendedDisplayName = (fiber: Fiber): ExtendedDisplayName => {
  if (!fiber) {
    return {
      name: 'Unknown',
      wrappers: [],
      wrapperTypes: [],
    };
  }

  const { tag, type, elementType } = fiber;
  let name = getDisplayName(type);
  const wrappers: Array<string> = [];
  const wrapperTypes: Array<WrapperBadge> = [];

  if (
    hasMemoCache(fiber) ||
    tag === SimpleMemoComponentTag ||
    tag === MemoComponentTag ||
    (type as { $$typeof?: symbol })?.$$typeof === Symbol.for('react.memo') ||
    (elementType as { $$typeof?: symbol })?.$$typeof ===
      Symbol.for('react.memo')
  ) {
    const compiler = hasMemoCache(fiber);
    wrapperTypes.push({
      type: 'memo',
      title: compiler
        ? 'This component has been auto-memoized by the React Compiler.'
        : 'Memoized component that skips re-renders if props are the same',
      compiler,
    });
  }

  if (tag === LazyComponentTag) {
    wrapperTypes.push({
      type: 'lazy',
      title: 'Lazily loaded component that supports code splitting',
    });
  }

  if (tag === SuspenseComponentTag) {
    wrapperTypes.push({
      type: 'suspense',
      title: 'Component that can suspend while content is loading',
    });
  }

  if (tag === ProfilerTag) {
    wrapperTypes.push({
      type: 'profiler',
      title: 'Component that measures rendering performance',
    });
  }

  if (typeof name === 'string') {
    const wrapperRegex = /^(\w+)\((.*)\)$/;
    let currentName = name;
    while (wrapperRegex.test(currentName)) {
      const match = currentName.match(wrapperRegex);
      if (match?.[1] && match?.[2]) {
        wrappers.unshift(match[1]);
        currentName = match[2];
      } else {
        break;
      }
    }
    name = currentName;
  }

  return {
    name: name || 'Unknown',
    wrappers,
    wrapperTypes,
  };
};
