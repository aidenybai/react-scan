import '../utils/dev-tools-hook';

import noReactStyles from '../assets/css/no-react.css?inline';
import { getReactVersion, loadCss } from '../utils/helpers';
import { CACHE_TTL, CACHE_NAME } from '../utils/constants';

const scriptsToInject = [
  'https://unpkg.com/react-scan/dist/auto.global.js',
];

const injectScript = (scriptURL: string, scriptContent: string) => {
  // Check if script already exists
  const existingScript = document.getElementById(scriptURL);
  if (existingScript) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptURL;
  script.textContent = scriptContent;

  document.documentElement.appendChild(script);
};

const getCacheKey = (scriptURL: string, timestamp: number) => `${scriptURL}?t=${timestamp}`;

const getLatestCacheEntry = async (cache: Cache, scriptURL: string) => {
  const keys = await cache.keys();
  const now = Date.now();

  // Get all entries for this script URL with their timestamps
  const matchingKeys = keys
    .map(req => req.url)
    .filter(url => url.startsWith(scriptURL + '?t='))
    .map(url => {
      const timestamp = parseInt(url.split('?t=')[1]);
      return { url, timestamp };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // Delete expired entries
  const expiredKeys = matchingKeys.filter(({ timestamp }) => now - timestamp >= CACHE_TTL);
  await Promise.all(expiredKeys.map(({ url }) => cache.delete(url)));

  // Return latest valid entry if exists
  if (matchingKeys.length > 0) {
    const latest = matchingKeys[0];
    if (now - latest.timestamp < CACHE_TTL) {
      return cache.match(latest.url);
    }
  }
  return null;
};

const injectReactScan = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    let needsReload = false;

    for (const scriptURL of scriptsToInject) {
      // Try to get latest valid cached version
      const cachedResponse = await getLatestCacheEntry(cache, scriptURL);

      if (cachedResponse) {
        const scriptContent = await cachedResponse.text();
        injectScript(scriptURL, scriptContent);
      } else {
        const response = await fetch(scriptURL, {
          cache: 'no-store',
        });

        if (response.ok) {
          const timestamp = Date.now();
          const cacheKey = getCacheKey(scriptURL, timestamp);
          await cache.put(cacheKey, response.clone());
          const scriptContent = await response.text();
          injectScript(scriptURL, scriptContent);
          needsReload = true;
        }
      }
    }

    if (needsReload) {
      window.location.reload();
    }
  } catch (error) {
    // Silent fail
  }
};

window.addEventListener('react-scan:is-csp-rules-enabled', (event) => {
  const cspRulesEnabled = (event as CustomEvent).detail.enabled;

  if (cspRulesEnabled) {
    void injectReactScan();
  }
});

window.addEventListener('react-scan:state-change', (event: Event) => {
  const { enabled } = (event as CustomEvent).detail;
  if (
    typeof window.__REACT_SCAN__?.ReactScanInternals === 'object' &&
    window.__REACT_SCAN__?.ReactScanInternals !== null
  ) {
    window.__REACT_SCAN__.ReactScanInternals.isPaused = enabled;
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const version = await getReactVersion();
  window.dispatchEvent(
    new CustomEvent('react-scan:update', {
      detail: {
        reactVersion: version,
      },
    }),
  );
});

(() => {
  // Toast
  const noReactStylesElement = document.createElement('style');
  noReactStylesElement.id = 'react-scan-no-react-styles';
  noReactStylesElement.innerHTML = noReactStyles;
  void loadCss(noReactStyles);

  const toast = document.createElement('div');
  toast.id = 'react-scan-toast';

  const message = document.createElement('span');
  message.id = 'react-scan-toast-message';
  message.innerHTML = "<span class='icon'>⚛️</span> React is not detected on this page. <br />Please ensure you're visiting a React application!";

  const button = document.createElement('button');
  button.id = 'react-scan-toast-close-button';
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  button.onclick = () => {
    document.documentElement.classList.remove('freeze');
    backdrop.className = 'animate-fade-out';
  };

  toast.appendChild(message);
  toast.appendChild(button);

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'react-scan-backdrop';
  backdrop.onclick = () => {
    document.documentElement.classList.remove('freeze');
    backdrop.className = 'animate-fade-out';
  };

  const fragment = document.createDocumentFragment();
  fragment.appendChild(noReactStylesElement);
  fragment.appendChild(backdrop);
  fragment.appendChild(toast);

  document.documentElement.appendChild(fragment);

  window.addEventListener('react-scan:check-version', async () => {
    const version = await getReactVersion();
    const isReactDetected = !['Unknown', 'Not Found'].includes(version);

    window.dispatchEvent(
      new CustomEvent('react-scan:version-check-result', {
        detail: { isReactDetected, version }
      })
    );

    if (!isReactDetected) {
      document.documentElement.classList.add('freeze');
      backdrop.className = 'animate-fade-in';
    }
  });
})();
