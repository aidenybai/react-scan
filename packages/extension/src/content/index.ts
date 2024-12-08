import styles from '../assets/css/styles.css?inline';
import { IncomingMessageSchema } from '../types/messages';
import { loadCss } from '../utils/helpers';


chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  const { data, error } = IncomingMessageSchema.safeParse(message);
  if (error) {
    // Silent fail
    return;
  }

  if (data.type === 'CHECK_REACT_VERSION') {
    window.addEventListener('react-scan:version-check-result', (event: Event) => {
      const { isReactDetected, version } = (event as CustomEvent).detail;
      sendResponse({ isReactDetected, version });
    }, { once: true });

    window.dispatchEvent(new CustomEvent('react-scan:check-version'));
    return true;
  }

  if (data.type === 'PING') {
    sendResponse(true);
    return;
  }

  switch (data.type) {
    case 'CSP_RULES_CHANGED':
      window.location.reload();
      break;
    case 'IS_CSP_RULES_ENABLED':
      window.dispatchEvent(
        new CustomEvent('react-scan:is-csp-rules-enabled', {
          detail: { ...data.data },
        }),
      );
      break;
  }
});

const getCSPRulesState = async () => chrome.runtime.sendMessage({
  type: 'IS_CSP_RULES_ENABLED',
  data: {
    domain: window.location.origin,
  },
}).then((cspRulesEnabled) => {
  window.dispatchEvent(
    new CustomEvent('react-scan:is-csp-rules-enabled', {
      detail: { ...cspRulesEnabled },
    }),
  );

  return cspRulesEnabled.enabled;
});

const init = (() => {
  let isInitialized = false;

  return async () => {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    loadCss(styles);

    const EXTENSION_ON_SVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-power"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>
    `;

    const el = document.createElement('button');
    el.classList.add('react-scan-extension-button', 'react-scan-default-font');
    el.innerHTML = EXTENSION_ON_SVG;

    el.onclick = async () => {
      const isCSPRulesEnabled = await getCSPRulesState();
      const toolbarContent = document.getElementById('react-scan-toolbar-content');

      window.dispatchEvent(
        new CustomEvent('react-scan:state-change', {
          detail: { enabled: isCSPRulesEnabled }
        })
      );

      if (isCSPRulesEnabled) {
        // send message to the extension to disable the rules
        await chrome.runtime.sendMessage({
          type: 'CSP_RULES_CHANGED',
          data: {
            enabled: false,
            domain: window.location.origin,
          },
        });
      } else {
        // send message to the extension to enable the rules
        await chrome.runtime.sendMessage({
          type: 'CSP_RULES_CHANGED',
          data: {
            enabled: true,
            domain: window.location.origin,
          },
        });

        window.location.reload();
      }

      await new Promise((resolve) => {
        if (toolbarContent) {
          toolbarContent.style.opacity = isCSPRulesEnabled ? '0' : '1';
          toolbarContent.style.pointerEvents = isCSPRulesEnabled ? 'none' : 'auto';
        }

        setTimeout(resolve, 400);
      });
    };

    const isCSPRulesEnabled = await getCSPRulesState();
    if (isCSPRulesEnabled) {
      setTimeout(() => {
        const toolbar = document.getElementById('react-scan-toolbar');
        if (toolbar) {
          toolbar.appendChild(el);
          toolbar.style.opacity = '1';
        }
      }, 400);
    } else {
      document.documentElement.appendChild(el);
    }
  };
})();

window.addEventListener('react-scan:update', ((event: Event) => {
  const customEvent = event as CustomEvent;

  if (!['Unknown', 'Not Found'].includes(customEvent.detail.reactVersion)) {
    void init();
  }
}) as EventListener);
