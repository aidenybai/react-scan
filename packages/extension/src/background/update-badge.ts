import browser from 'webextension-polyfill';
import { isInternalUrl } from '../utils/helpers';
import { STORAGE_KEY } from '../utils/constants';

const ANIMATION_CONFIG = {
  size: 24,
  lineWidth: 1.5,
  inset: 0.5,
  borderRadius: 3,
  dashLength: 8,
  gapLength: 14,
  duration: 1500,
  color: '#A295EE',
} as const;

let animationInterval: any | null = null;

const drawBadgeIcon = async (
  ctx: OffscreenCanvasRenderingContext2D,
  enabled: boolean,
) => {
  const png = enabled ? 'icon-no-corners.png' : '128.png';
  const response = await fetch(browser.runtime.getURL(`icon/${png}`));
  const bitmap = await createImageBitmap(await response.blob());
  ctx.drawImage(bitmap, 0, 0, ANIMATION_CONFIG.size, ANIMATION_CONFIG.size);
};

const calculateDashPattern = () => {
  const { size, lineWidth, inset, borderRadius, dashLength, gapLength } =
    ANIMATION_CONFIG;
  const width = size - lineWidth - inset * 2;
  const height = width;
  const perimeter = 2 * (width + height) + 2 * Math.PI * borderRadius;
  const patternLength = dashLength + gapLength;
  const totalPatterns = Math.ceil(perimeter / patternLength);

  return {
    width,
    height,
    perimeter,
    dashLength: (perimeter / totalPatterns) * (dashLength / patternLength),
    gapLength: (perimeter / totalPatterns) * (gapLength / patternLength),
  };
};

export const clearBadgeAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};

const startAnimation = (duration: number) => {
  clearBadgeAnimation();
  const interval = Math.floor(duration / 30);
  animationInterval = setInterval(animateBadge, interval);
};

export const updateBadge = async (enabled: boolean | null): Promise<number> => {
  const { size, lineWidth, inset, borderRadius, duration, color } =
    ANIMATION_CONFIG;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return duration;
  }

  await drawBadgeIcon(ctx, Boolean(enabled));

  if (enabled) {
    const { width, height, perimeter, dashLength, gapLength } =
      calculateDashPattern();

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    const timestamp = Date.now();
    const progress = (timestamp % duration) / duration;

    ctx.setLineDash([dashLength, gapLength]);
    ctx.lineDashOffset = progress * -perimeter;

    ctx.beginPath();
    ctx.roundRect(
      inset + lineWidth / 2,
      inset + lineWidth / 2,
      width,
      height,
      borderRadius,
    );
    ctx.stroke();
  }

  await chrome.action.setIcon({
    imageData: ctx.getImageData(0, 0, size, size),
  });

  return duration;
};

const animateBadge = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || isInternalUrl(tab.url)) {
    clearBadgeAnimation();
    return;
  }

  const domain = new URL(tab.url).origin;
  const currentDomains =
    (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
  const isEnabled = domain in currentDomains && currentDomains[domain] === true;

  if (isEnabled) {
    await updateBadge(true);
  } else {
    clearBadgeAnimation();
    await updateBadge(false);
  }
};

export const updateBadgeForCurrentTab = async () => {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    if (!tab.url || isInternalUrl(tab.url)) {
      await updateBadge(null);
      return;
    }

    if (!animationInterval) {
      const duration = await updateBadge(true);
      startAnimation(duration);
    }
    void animateBadge();
  } catch (error) {
    // Silent fail
  }
};

// Tab event listeners
browser.tabs.onActivated.addListener(() => {
  void updateBadgeForCurrentTab();
});

browser.tabs.onUpdated.addListener((_, changeInfo) => {
  if (changeInfo.status === 'complete') {
    void updateBadgeForCurrentTab();
  }
});

browser.tabs.onCreated.addListener(() => {
  void updateBadge(null);
});

browser.runtime.onSuspend.addListener(clearBadgeAnimation);
