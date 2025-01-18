import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: Array<ClassValue>): string => {
  return twMerge(clsx(inputs));
};

export const isFirefox =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');

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
export const debounce = <T extends (enabled: boolean | null) => Promise<void>>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {},
) => {
  let timeoutId: number | undefined;
  let lastArg: boolean | null | undefined;
  let isLeadingInvoked = false;

  const debounced = (enabled: boolean | null) => {
    lastArg = enabled;

    if (options.leading && !isLeadingInvoked) {
      isLeadingInvoked = true;
      fn(enabled);
      return;
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    if (options.trailing !== false) {
      timeoutId = window.setTimeout(() => {
        isLeadingInvoked = false;
        timeoutId = undefined;
        if (lastArg !== undefined) {
          fn(lastArg);
        }
      }, wait);
    }
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      isLeadingInvoked = false;
      lastArg = undefined;
    }
  };

  return debounced;
};

export const createElement = (htmlString: string): HTMLElement => {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstElementChild as HTMLElement;
};

export const tryOrElse = <T>(fn: () => T, defaultValue: T): T => {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
};

export const readLocalStorage = <T>(storageKey: string): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveLocalStorage = <T>(storageKey: string, state: T): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Silently fail
  }
};
export const removeLocalStorage = (storageKey: string): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Silently fail
  }
};

export const toggleMultipleClasses = (
  element: HTMLElement,
  classes: Array<string>,
) => {
  for (const cls of classes) {
    element.classList.toggle(cls);
  }
};
