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

export const throttle = <T extends (...args: Array<any>) => any>(
  callback: T,
  delay: number,
) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return callback(...args);
    }
  };
};

export const debounce = <T extends (...args: Array<any>) => any>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {},
) => {
  let timeoutId: number | undefined;
  let lastArgs: Parameters<T> | undefined;
  let isLeadingInvoked = false;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;

    if (options.leading && !isLeadingInvoked) {
      isLeadingInvoked = true;
      fn(...args);
      return;
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    if (options.trailing !== false) {
      timeoutId = window.setTimeout(() => {
        isLeadingInvoked = false;
        timeoutId = undefined;
        fn(...lastArgs!);
      }, wait);
    }
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      isLeadingInvoked = false;
      lastArgs = undefined;
    }
  };

  return debounced;
};

export const createElement = (htmlString: string): HTMLElement => {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstElementChild as HTMLElement;
};

export const tryOrElse = <T, E>(cb: () => T, val: E) => {
  try {
    return cb();
  } catch (e) {
    return val;
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

export const toggleMultipleClasses = (
  element: HTMLElement,
  ...classes: Array<string>
) => {
  classes.forEach((cls) => element.classList.toggle(cls));
};
