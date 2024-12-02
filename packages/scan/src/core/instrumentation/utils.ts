import * as React from 'react';

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

export const getType = (type: any): any => {
  if (typeof type === 'function') {
    return type;
  }
  if (typeof type === 'object' && type) {
    // memo / forwardRef case
    return getType(type.type || type.render);
  }
  return null;
};

export const getDisplayName = (type: any): string | null => {
  const name = type.displayName || type.name || null;
  if (name) return name;
  type = getType(type);
  if (!type) return null;
  return type.displayName || type.name || null;
};
