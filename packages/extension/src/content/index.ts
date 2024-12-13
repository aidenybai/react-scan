import styles from '../assets/css/styles.css?inline';
import { BroadcastSchema } from '../types/messages';
import { loadCss, broadcast } from '../utils/helpers';

const isIframe = window !== window.top;
const isPopup = window.opener !== null;

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const result = BroadcastSchema.safeParse(message);

  if (result.success) {
    const data = result.data;

    if (data.type === 'react-scan:ping') {
      sendResponse(true);
      return false;
    }

    if (data.type === 'react-scan:check-version') {
      broadcast.onmessage = (type, msgData) => {
        if (type === 'react-scan:update') {
          const response = {
            isReactDetected: !['Unknown', 'Not Found'].includes(msgData.reactVersion),
            version: msgData.reactVersion
          };
          sendResponse(response);
        }
      };

      // Send the check message
      broadcast.postMessage('react-scan:check-version', {});

      return true; // Keep the message channel open
    }

    if (data.type === 'react-scan:csp-rules-changed') {
      window.location.reload();
    }
  }
  return true;
});

const getCSPRulesState = async () => chrome.runtime.sendMessage({
  type: 'react-scan:is-csp-rules-enabled',
  data: {
    domain: window.location.origin,
  },
}).then((cspRulesEnabled) => {
  if (isIframe || isPopup) {
    return false;
  }

  broadcast.postMessage('react-scan:is-csp-rules-enabled', cspRulesEnabled);

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

    const isCSPRulesEnabled = await getCSPRulesState();
    if (isCSPRulesEnabled) {
      setTimeout(() => {
        const toolbar = document.getElementById('react-scan-toolbar');
        if (toolbar) {
          // toolbar.appendChild(el);
          toolbar.style.opacity = '1';
        }
      }, 400);
    }
  };
})();

broadcast.onmessage = (type, data) => {
  if (type === 'react-scan:update') {
    if (!['Unknown', 'Not Found'].includes(data.reactVersion)) {
      void init();
    }
  }
};
