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
  } catch {}
};
export const removeLocalStorage = (storageKey: string): void => {
  if (typeof window === 'undefined') return;

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
