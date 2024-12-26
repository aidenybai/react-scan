import browser from 'webextension-polyfill';
import { debounce } from '../utils/helpers';

const ANIMATION_CONFIG = {
  size: 24,
  lineWidth: 1.5,
  inset: 0,
  borderRadius: 3,
  dashLength: 3.5,
  dashCount: 4,
  gapLength: 2.5,
  color: '#A295EE',
  frameCount: 60,
  fps: 30,
  duration: 1200,
  initialFrame: 6,
  stopFrame: 6,
} as const;

let animationInterval: number | null = null;
const preRenderedFrames: Array<Record<string, {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  colorSpace: 'srgb';
}>> = [];
let frameIndex = 0;
let isStoppingAnimation = false;

const browserAction = browser.action || browser.browserAction;
const isFirefox = browser.runtime.getURL('').startsWith('moz-extension://');

let lastEnabledState: boolean | null = null;
let lastStateChangeTime = 0;
const MIN_STATE_CHANGE_INTERVAL = 100;

const generateFrames = async (): Promise<void> => {
  const { frameCount } = ANIMATION_CONFIG;
  const sizes = [16, 24, 32];
  preRenderedFrames.length = 0;

  for (let i = 0; i < frameCount; i++) {
    const frames: Record<string, {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      colorSpace: 'srgb';
    }> = {};

    for (const size of sizes) {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const response = await fetch(browser.runtime.getURL('icon/icon-no-corners.png'));
      const bitmap = await createImageBitmap(await response.blob());
      ctx.drawImage(bitmap, 0, 0, size, size);

      const scale = size / ANIMATION_CONFIG.size;
      const lineWidth = ANIMATION_CONFIG.lineWidth * scale;
      const inset = ANIMATION_CONFIG.inset * scale;
      const borderRadius = ANIMATION_CONFIG.borderRadius * scale;

      const width = size - lineWidth - inset * 2;
      const height = width;
      const perimeter = 2 * (width + height) + 2 * Math.PI * borderRadius;

      const dashLength = (perimeter / (ANIMATION_CONFIG.dashCount + 1)) * 0.4;
      const gapLength = (perimeter / (ANIMATION_CONFIG.dashCount + 1)) * 0.6;

      const progress = (i / frameCount) * 2 * Math.PI;

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = ANIMATION_CONFIG.color;
      ctx.setLineDash([dashLength, gapLength]);
      ctx.lineDashOffset = (progress * -perimeter / (2 * Math.PI)) - (dashLength / 2);

      ctx.beginPath();
      ctx.roundRect(
        inset + lineWidth / 2,
        inset + lineWidth / 2,
        width,
        height,
        borderRadius
      );
      ctx.stroke();

      frames[size] = {
        width: size,
        height: size,
        data: ctx.getImageData(0, 0, size, size).data,
        colorSpace: 'srgb'
      };
    }

    preRenderedFrames.push(frames);
  }
};

const startAnimation = async (): Promise<void> => {
  if (animationInterval) {
    stopAnimation();
  }

  isStoppingAnimation = false;
  const { fps, initialFrame, duration } = ANIMATION_CONFIG;
  frameIndex = initialFrame;
  const frameDelay = duration / fps;

  animationInterval = setInterval(async () => {
    const frames = preRenderedFrames[frameIndex];
    if (!frames) {
      stopAnimation();
      return;
    }

    try {
      await browserAction.setIcon({
        imageData: frames
      });
    } catch {
      stopAnimation();
      return;
    }

    frameIndex = (frameIndex + 1) % preRenderedFrames.length;

    if (isStoppingAnimation && frameIndex === ANIMATION_CONFIG.stopFrame) {
      stopAnimation();
    }
  }, frameDelay);
};

const stopAnimation = (): void => {
  if (animationInterval) {
    if (frameIndex === ANIMATION_CONFIG.stopFrame) {
      clearInterval(animationInterval);
      animationInterval = null;
    } else {
      isStoppingAnimation = true;
    }
  }
};

export const updateIcon = async (enabled: boolean | null): Promise<void> => {
  const now = Date.now();

  if (enabled !== lastEnabledState && now - lastStateChangeTime < MIN_STATE_CHANGE_INTERVAL) {
    return;
  }

  if (enabled === lastEnabledState) return;
  lastEnabledState = enabled;
  lastStateChangeTime = now;

  stopAnimation();

  if (!enabled) {
    try {
      await browserAction.setIcon({
        path: {
          "16": browser.runtime.getURL('icon/16.png'),
          "32": browser.runtime.getURL('icon/32.png'),
          "48": browser.runtime.getURL('icon/48.png'),
          "96": browser.runtime.getURL('icon/96.png'),
          "128": browser.runtime.getURL('icon/128.png')
        }
      });
    } catch {}
    return;
  }

  try {
    if (enabled) {
      if (isFirefox) {
        // Use animated SVG for Firefox
        await browserAction.setIcon({
          path: {
            "16": browser.runtime.getURL('icon/logo-animated.svg'),
            "32": browser.runtime.getURL('icon/logo-animated.svg'),
            "48": browser.runtime.getURL('icon/logo-animated.svg'),
            "96": browser.runtime.getURL('icon/logo-animated.svg'),
            "128": browser.runtime.getURL('icon/logo-animated.svg')
          }
        });
      } else {
        // Use canvas animation for other browsers
        if (!preRenderedFrames.length) {
          await generateFrames();
        }
        await startAnimation();
      }
    }
  } catch {
    stopAnimation();
  }
};

const debouncedUpdateIcon = debounce(updateIcon, 300);

browser.tabs.onActivated.addListener(() => {
  void stopAnimation();
});

browser.tabs.onUpdated.addListener((_, changeInfo) => {
  if (changeInfo.status === 'complete') {
    void stopAnimation();
  }
});

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'react-scan:is-focused') {
    debouncedUpdateIcon(message.data.state);
  }
});

browser.runtime.onSuspend.addListener(stopAnimation);
