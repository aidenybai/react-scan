import browser from 'webextension-polyfill';
import { IncomingMessageSchema, type OutgoingMessage } from './types/messages';
// Helper function to get React version
function getReactVersion(): string {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || !hook.renderers) {
    return 'Not Found';
  }

  // Get the first renderer
  const firstRenderer = Array.from(hook.renderers.values())[0];
  if (!firstRenderer) {
    return 'Not Found';
  }

  const version = (firstRenderer as any)?.version;
  return version ?? 'Unknown';
}

console.log('content loaded', getReactVersion());

// Wait for document to be ready before sending initial message
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log(
      'sending initial message',
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
    );
  }, 1000);
  browser.runtime.sendMessage({
    type: 'SCAN_UPDATE',
    reactVersion: getReactVersion(),
    componentCount: 0,
    rerenderCount: 0,
    status: 'Starting scan...',
  });
});

chrome.runtime.onMessage.addListener((message: unknown) => {
  const { data, error } = IncomingMessageSchema.safeParse(message);
  if (error) {
    console.error('Invalid message', error);
    return;
  }

  switch (data.type) {
    case 'OPEN_PANEL':
      window.dispatchEvent(new CustomEvent('react-scan:toggle-panel'));
      break;
    case 'START_SCAN':
      window.dispatchEvent(new CustomEvent('react-scan:start'));
      // Send initial version when scanning starts
      break;
    case 'STOP_SCAN':
      window.dispatchEvent(new CustomEvent('react-scan:stop'));
      break;
  }
});

window.addEventListener('react-scan:update', ((event: Event) => {
  const customEvent = event as CustomEvent;
  const message: OutgoingMessage = {
    type: 'SCAN_UPDATE',
    reactVersion: getReactVersion(),
    ...customEvent.detail,
  };
  chrome.runtime.sendMessage(message);
}) as EventListener);
