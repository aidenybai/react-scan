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

export const getReactVersion = (retries = 10, delay = 10): Promise<string> => {
  return new Promise((resolve) => {
    const check = (attempt = 0) => {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook || !hook.renderers) {
        if (attempt < retries) {
          setTimeout(() => check(attempt + 1), delay);
        } else {
          resolve('Not Found');
        }
        return;
      }

      const firstRenderer = Array.from(hook.renderers.values())[0];
      if (!firstRenderer) {
        if (attempt < retries) {
          setTimeout(() => check(attempt + 1), delay);
        } else {
          resolve('Not Found');
        }
        return;
      }

      const version = firstRenderer?.version;
      resolve(version ?? 'Unknown');
    };

    check();
  });
};
