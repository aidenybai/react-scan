import { broadcastChannel } from "./constants";

export const isIframe = window !== window.top;
export const isPopup = window.opener !== null;
export const canLoadReactScan = !isIframe && !isPopup;

export const NO_OP = () => {
  /**/
};

export const isInternalUrl = (url: string): boolean => {
  if (!url) return false;

  const allowedProtocols = ['http:', 'https:', 'file:'];
  return !allowedProtocols.includes(new URL(url).protocol);
};

export const loadCss = (css: string) => {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.documentElement.appendChild(style);
};

export const getReactVersion = (retries = 10, delay = 10): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const check = (attempt = 0) => {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook || !hook.renderers) {
        if (attempt < retries) {
          setTimeout(() => check(attempt + 1), delay);
        } else {
          resolve(undefined);
        }
        return;
      }

      const firstRenderer = Array.from(hook.renderers.values())[0];
      if (!firstRenderer) {
        if (attempt < retries) {
          setTimeout(() => check(attempt + 1), delay);
        } else {
          resolve(undefined);
        }
        return;
      }

      const version = firstRenderer?.version;
      resolve(version);
    };

    check();
  });
};

export const broadcast = {
  postMessage: (type: string, data?: unknown) => {
    broadcastChannel.postMessage({ type, data });
  },
  set onmessage(handler: BroadcastHandler | null) {
    broadcastChannel.onmessage = handler
      ? (event) => handler(event.data.type, event.data.data)
      : null;
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
  } catch {}
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;

  return (...args: Parameters<T>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait) as unknown as number;
  };
};
