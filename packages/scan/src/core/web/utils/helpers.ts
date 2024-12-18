import {
  type ClassValue,
  clsx,
} from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type PendingOutline } from './outline';

export const cn = (...inputs: Array<ClassValue>): string => {
  return twMerge(clsx(inputs));
};

export const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');

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


export const debounce = <T extends (...args: Array<any>) => void>(
  fn: T,
  delay: number
) => {
  let timeoutId: number;

  const debounced = (...args: Parameters<T>) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };

  debounced.cancel = () => window.clearTimeout(timeoutId);

  return debounced;
}


export const isOutlineUnstable = (outline: PendingOutline) => {
  for (let i = 0, len = outline.renders.length; i < len; i++) {
    const render = outline.renders[i];
    if (!render.changes) continue;
    for (let j = 0, len2 = render.changes.length; j < len2; j++) {
      const change = render.changes[j];
      if (change.unstable) {
        return true;
      }
    }
  }
  return false;
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

export const saveLocalStorage = <T>(storageKey: string, state: T): | void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Silently fail
  }
};

export const toggleMultipleClasses = (element: HTMLElement, ...classes: Array<string>) => {
  classes.forEach(cls => element.classList.toggle(cls));
};
