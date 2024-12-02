import browser from 'webextension-polyfill';
import type { OutgoingMessage } from './types/messages';

// Store the latest state
let currentState: OutgoingMessage | null = null;

// Listen for messages from content script
browser.runtime.onMessage.addListener((message: unknown) => {
  // Store the latest state
  if (typeof message === 'object' && message !== null && 'type' in message) {
    currentState = message as OutgoingMessage;
  }

  // Forward the message to any open popups
  void browser.runtime.sendMessage(message).catch(() => {
    // Ignore errors when popup is closed
  });
});

// Listen for connection from popup to send initial state
browser.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    // Send the current state when popup connects
    if (currentState) {
      port.postMessage(currentState);
    }
  }
});
