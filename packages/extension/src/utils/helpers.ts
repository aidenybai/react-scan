export const isIframe = window !== window.top;
export const isPopup = window.opener !== null;
export const canLoadReactScan = !isIframe && !isPopup;

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

interface ReactRootContainer {
  _reactRootContainer?: {
    _internalRoot?: {
      current?: {
        child: unknown;
      };
    };
  };
}

const ReactDetection = {
  limits: {
    MAX_DEPTH: 10,
    MAX_ELEMENTS: 30,
    ELEMENTS_PER_LEVEL: 5
  },
  nonVisualTags: new Set([
    // Document level
    'HTML', 'HEAD', 'META', 'TITLE', 'BASE',
    // Scripts and styles
    'SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT',
    // Media and embeds
    'SOURCE', 'TRACK', 'EMBED', 'OBJECT', 'PARAM',
    // Special elements
    'TEMPLATE', 'PORTAL', 'SLOT',
    // Others
    'AREA', 'XML', 'DOCTYPE', 'COMMENT'
  ]),
  reactMarkers: {
    root: '_reactRootContainer',
    fiber: '__reactFiber',
    instance: '__reactInternalInstance$'
  }
} as const;

const childrenCache = new WeakMap<Element, Element[]>();

export const hasReactFiber = (): boolean => {
  const rootElement = document.body;
  let elementsChecked = 0;

  const getChildren = (element: Element): Element[] => {
    let children = childrenCache.get(element);
    if (!children) {
      const childNodes = element.children;
      children = [];
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (!ReactDetection.nonVisualTags.has(child.tagName)) {
          children.push(child);
        }
      }
      childrenCache.set(element, children);
    }
    return children;
  };

  const checkElement = (element: Element, depth: number): boolean => {
    if (elementsChecked >= ReactDetection.limits.MAX_ELEMENTS) return false;
    elementsChecked++;

    const props = Object.getOwnPropertyNames(element);

    if (ReactDetection.reactMarkers.root in element) {
      const elementWithRoot = element as unknown as ReactRootContainer;
      const rootContainer = elementWithRoot._reactRootContainer;
      return rootContainer?._internalRoot?.current?.child != null;
    }

    for (const key of props) {
      if (
        key.startsWith(ReactDetection.reactMarkers.fiber) ||
        key.startsWith(ReactDetection.reactMarkers.instance)
      ) {
        return true;
      }
    }

    if (depth < ReactDetection.limits.MAX_DEPTH) {
      const children = getChildren(element);
      const maxCheck = Math.min(children.length, ReactDetection.limits.ELEMENTS_PER_LEVEL);

      for (let i = 0; i < maxCheck; i++) {
        if (checkElement(children[i], depth + 1)) {
          return true;
        }
      }
    }

    return false;
  };

  return checkElement(rootElement, 0);
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
      timeoutId = setTimeout(() => {
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
