import * as React from 'react';
import { getDisplayName } from './fiber';

export const onIdle = (callback: () => void) => {
  if ('scheduler' in globalThis) {
    return globalThis.scheduler.postTask(callback, {
      priority: 'background',
    });
  }
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback);
  }
  return setTimeout(callback, 0);
};

export const fastSerialize = (value: unknown) => {
  switch (typeof value) {
    case 'function':
      return value.toString();
    case 'string':
      return value;
    case 'object':
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? '[…]' : '[]';
      }
      if (
        React.isValidElement(value) &&
        '$$typeof' in value &&
        typeof value.$$typeof === 'symbol' &&
        String(value.$$typeof) === 'Symbol(react.element)'
      ) {
        // attempt to extract some name from the component
        return `<${getDisplayName(value.type) ?? ''}${
          Object.keys(value.props || {}).length > 0 ? ' …' : ''
        }>`;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor === Object
      ) {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            return '{…}';
          }
        }
        return '{}';
      }
      // eslint-disable-next-line no-case-declarations
      const tagString = Object.prototype.toString.call(value).slice(8, -1);
      if (tagString === 'Object') {
        const proto = Object.getPrototypeOf(value);
        const constructor = proto?.constructor;
        if (typeof constructor === 'function') {
          return `${constructor.displayName || constructor.name || ''}{…}`;
        }
      }
      return `${tagString}{…}`;
    default:
      return String(value);
  }
};

export const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (_err) {
    return true;
  }
};

const tempDivElement = React.createElement('div');
export const isProd = () => {
  return '_self' in tempDivElement;
};

export const NO_OP = () => {
  /**/
};

const unstableTypes = ['function', 'object'];

export const didChange = (prevValue: any, nextValue: any) => {
  if (Object.is(prevValue, nextValue)) return false;

  const prevValueString = fastSerialize(prevValue);
  const nextValueString = fastSerialize(nextValue);

  if (
    !unstableTypes.includes(typeof prevValue) ||
    !unstableTypes.includes(typeof nextValue) ||
    prevValueString !== nextValueString
  ) {
    return true;
  }

  return 'unstable';
};
