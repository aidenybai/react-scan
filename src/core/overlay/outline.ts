import * as React from 'react';
import { type Fiber } from 'react-reconciler';
import { traverseFiber } from '../monitor/fiber';
import type { Render } from '../monitor';

export interface Outline {
  rect: DOMRect;
  count: number;

}

export const getOutline = (fiber: Fiber, render: Render): Outline | null => {
  let domFiber = traverseFiber(fiber, (node) => typeof node.type === 'string');
  if (!domFiber) {
    domFiber = traverseFiber(
      fiber,
      (node) => typeof node.type === 'string',
      true,
    );
  }
  if (!domFiber) return null;

  const domNode = domFiber.stateNode;

  if (!(domNode instanceof HTMLElement)) return null;

  if (
    domNode.tagName.toLowerCase().includes('million') ||
    domNode.hasAttribute('data-react-scan-ignore')
  ) {
    return null;
  }

  const style = window.getComputedStyle(domNode);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return null;
  }

  const rect = domNode.getBoundingClientRect();
  const isVisible =
    rect.top >= 0 ||
    rect.left >= 0 ||
    rect.bottom <= window.innerHeight ||
    rect.right <= window.innerWidth;

  if (!isVisible) return null;

  if (!rect.height || !rect.width) return null;

  let prevChangedProps: Record<string, any> | null = null;
  let nextChangedProps: Record<string, any> | null = null;

  if (render.changes) {
    for (let i = 0, len = render.changes.length; i < len; i++) {
      const { name, prevValue, nextValue, unstable } = render.changes[i];
      if (!unstable) continue;
      prevChangedProps ??= {};
      nextChangedProps ??= {};
      prevChangedProps[`${name} (prev)`] = prevValue;
      nextChangedProps[`${name} (next)`] = nextValue;
    }
  }

  return {
    rect,
    names: new Set([name]),
    count: 1,
    totalTime,
    selfTime,
    unstable,
    forget: hasMemoCache,
    trigger: false,
  };
};
