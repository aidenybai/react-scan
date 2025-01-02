import { useEffect, useRef, useState, useMemo, useCallback } from 'preact/hooks';
import { getDisplayName } from 'bippy';
import type { Fiber } from 'react-reconciler';
import { Component } from 'preact';
import { memo } from 'preact/compat';
import { signal } from "@preact/signals";
import { Store } from '~core/index';
import { isEqual } from '~core/utils';
import { cn, tryOrElse } from '~web/utils/helpers';
import { getCompositeComponentFromElement, getOverrideMethods } from './utils';
import {
  getChangedProps,
  getChangedContext,
  getStateChangeCount,
  getPropsChangeCount,
  getContextChangeCount,
  getCurrentState,
  getCurrentProps,
  getCurrentContext,
  resetStateTracking,
  getStateNames,
  getAllFiberContexts,
  getChangedState
} from './overlay/utils';
import { flashManager } from './flash-overlay';

const EXPANDED_PATHS = new Set<string>();
const lastRendered = new Map<string, unknown>();
let lastInspectedFiber: Fiber | null = null;

interface InspectorState {
  fiber: Fiber | null;
  changes: {
    state: Set<string>;
    props: Set<string>;
    context: Set<string>;
  };
  current: {
    state: Record<string, unknown>;
    props: Record<string, unknown>;
    context: Record<string, unknown>;
  };
}

const inspectorState = signal<InspectorState>({
  fiber: null,
  changes: {
    state: new Set(),
    props: new Set(),
    context: new Set()
  },
  current: {
    state: {},
    props: {},
    context: {}
  }
});

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

const isExpandable = (value: unknown): value is Record<string, unknown> | Array<unknown> | ArrayBuffer | DataView | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array => {
  if (value === null || typeof value !== 'object' || value instanceof Promise) {
    return false;
  }

  // Handle buffer types - always treat them as expandable
  if (value instanceof ArrayBuffer) {
    return true;  // Always expandable to show bytes
  }

  if (value instanceof DataView) {
    return true;  // Always expandable to show bytes
  }

  if (ArrayBuffer.isView(value)) {
    return true;  // Always expandable to show elements
  }

  // Handle collections
  if (value instanceof Map) {
    return value.size > 0;
  }

  if (value instanceof Set) {
    return value.size > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Object.keys(value).length > 0;
};

const isPromise = (value: any): value is Promise<unknown> => {
  return value && (value instanceof Promise || (typeof value === 'object' && 'then' in value));
};

const isEditableValue = (value: unknown): boolean => {
  // Basic types are always editable
  if (typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint') return true;

  if (value === null || value === undefined) return true;

  // Special objects
  if (value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error) return true;

  // Everything else is not directly editable
  return false;
};

const getPath = (
  componentName: string,
  section: string,
  parentPath: string,
  key: string,
): string => {
  if (parentPath) {
    return `${componentName}.${parentPath}.${key}`;
  }

  if (section === 'context' && !key.startsWith('context.')) {
    return `${componentName}.${section}.context.${key}`;
  }

  return `${componentName}.${section}.${key}`;
};

const MAX_ARRAY_PREVIEW = 3;  // Show only first 3 items in arrays
const MAX_OBJECT_KEYS = 5;    // Show only first 5 keys in objects

const getArrayLength = (obj: ArrayBufferView): number => {
  if (obj instanceof DataView) {
    return obj.byteLength;
  }
  // TypedArray has length property
  return (obj as TypedArray).length;
};

const formatValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value instanceof Promise) return 'Promise';

  if (value instanceof Map) {
    return `Map(${value.size})`;
  }

  if (value instanceof Set) {
    return `Set(${value.size})`;
  }

  if (value instanceof Date) return 'Date';
  if (value instanceof RegExp) return 'RegExp';
  if (value instanceof Error) return 'Error';

  if (value instanceof ArrayBuffer) {
    return `ArrayBuffer(${value.byteLength})`;
  }

  if (value instanceof DataView) {
    return `DataView(${value.byteLength})`;
  }

  if (ArrayBuffer.isView(value)) {
    return `${value.constructor.name}(${getArrayLength(value)})`;
  }

  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  switch (typeof value) {
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    case 'symbol':
      return value.toString();
    case 'object': {
      const keys = Object.keys(value);
      if (keys.length <= 5) return `{${keys.join(', ')}}`;
      return `{${keys.slice(0, 5).join(', ')}, ...${keys.length - 5}}`;
    }
    default:
      return typeof value;
  }
};

export const replayComponent = async (fiber: Fiber): Promise<void> => {
  try {
    const { overrideProps, overrideHookState } = getOverrideMethods();
    if (!overrideProps || !overrideHookState || !fiber) return;

    const currentProps = fiber.memoizedProps || {};
    Object.keys(currentProps).forEach((key) => {
      try {
        overrideProps(fiber, [key], currentProps[key]);
      } catch (e) {
        // Silently ignore prop override errors
      }
    });

    const state = getCurrentState(fiber) ?? {};
    Object.keys(state).forEach((key) => {
      try {
        const stateNames = getStateNames(fiber);
        const namedStateIndex = stateNames.indexOf(key);
        const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
        overrideHookState(fiber, hookId, [], state[key]);
      } catch (e) {
        // Silently ignore state override errors
      }
    });

    let child = fiber.child;
    while (child) {
      await replayComponent(child);
      child = child.sibling;
    }
  } catch (e) {
    // Silently ignore replay errors
  }
};

const THROTTLE_MS = 16;
const DEBOUNCE_MS = 150;

export const Inspector = memo(() => {
  useEffect(() => {
    let rafId: ReturnType<typeof requestAnimationFrame>;
    let debounceTimer: ReturnType<typeof setTimeout>;
    let lastUpdateTime = 0;
    let isProcessing = false;
    let pendingFiber: Fiber | null = null;

    const updateInspectorState = (fiber: Fiber) => {
      const isNewComponent = !lastInspectedFiber || lastInspectedFiber.type !== fiber.type;
      if (isNewComponent) {
        resetStateTracking();
      }

      inspectorState.value = {
        fiber,
        changes: {
          props: getChangedProps(fiber),
          state: getChangedState(fiber),
          context: getChangedContext(fiber)
        },
        current: {
          state: getCurrentState(fiber) ?? {},
          props: getCurrentProps(fiber),
          context: getCurrentContext(fiber)
        }
      };

      lastInspectedFiber = fiber;
    };

    const processFiberUpdate = (fiber: Fiber) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;

      clearTimeout(debounceTimer);
      cancelAnimationFrame(rafId);

      if (timeSinceLastUpdate < THROTTLE_MS) {
        pendingFiber = fiber;
        debounceTimer = setTimeout(() => {
          rafId = requestAnimationFrame(() => {
            if (pendingFiber) {
              isProcessing = true;
              updateInspectorState(pendingFiber);
              isProcessing = false;
              pendingFiber = null;
              lastUpdateTime = Date.now();
            }
          });
        }, DEBOUNCE_MS);
        return;
      }

      rafId = requestAnimationFrame(() => {
        isProcessing = true;
        updateInspectorState(fiber);
        isProcessing = false;
        lastUpdateTime = now;
      });
    };

    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused' || !state.focusedDomElement) return;

      const { parentCompositeFiber } = getCompositeComponentFromElement(state.focusedDomElement);
      if (!parentCompositeFiber) return;

      processFiberUpdate(parentCompositeFiber);
    });

    const unSubReport = Store.lastReportTime.subscribe(() => {
      if (isProcessing) return;

      const inspectState = Store.inspectState.value;
      if (inspectState.kind !== 'focused') return;

      const element = inspectState.focusedDomElement;
      const { parentCompositeFiber } = getCompositeComponentFromElement(element);

      if (parentCompositeFiber && lastInspectedFiber) {
        processFiberUpdate(parentCompositeFiber);
      }
    });

    return () => {
      unSubState();
      unSubReport();
      clearTimeout(debounceTimer);
      cancelAnimationFrame(rafId);
      pendingFiber = null;
    };
  }, []);

  if (!inspectorState.value.fiber) return null;

  return (
    <InspectorErrorBoundary>
      <div className="react-scan-inspector">
        <WhatChanged />
        <SectionProps />
        <SectionState />
        <SectionContext />
      </div>
    </InspectorErrorBoundary>
  );
});

interface PropertyElementProps {
  name: string;
  value: unknown;
  fiber: Fiber;
  section: string;
  level: number;
  parentPath?: string;
  objectPathMap?: WeakMap<object, Set<string>>;
  changedKeys?: Set<string>;
  hasCumulativeChanges?: boolean;
}

interface PropertySectionProps {
  title: string;
  data: Record<string, unknown>;
  fiber: Fiber;
  section: 'props' | 'state' | 'context';
}

interface EditableValueProps {
  value: unknown;
  onSave: (newValue: unknown) => void;
  onCancel: () => void;
}

// Add security utilities
const sanitizeString = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential javascript: URLs
    .replace(/data:/gi, '') // Remove potential data: URLs
    .replace(/on\w+=/gi, '') // Remove potential event handlers
    .slice(0, 50000); // Limit string length
};

const sanitizeErrorMessage = (error: string): string => {
  return error
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const parseArrayValue = (value: string): Array<unknown> => {
  // Handle empty array
  if (value.trim() === '[]') return [];

  const result: Array<unknown> = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    if (char === '[' || char === '{') {
      depth++;
      current += char;
      continue;
    }

    if (char === ']' || char === '}') {
      depth--;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        result.push(parseValue(current.trim(), ''));
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(parseValue(current.trim(), ''));
  }

  return result;
};

const parseValue = (value: string, currentType: unknown, propertyName?: string): unknown => {
  try {
    // Handle basic types first
    if (typeof currentType === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) return currentType;
      // If this is a byte in an ArrayBuffer, clamp it to 0-255
      return numValue & 0xFF;
    }
    if (typeof currentType === 'string') return value;
    if (typeof currentType === 'boolean') return value === 'true';
    if (typeof currentType === 'bigint') return BigInt(value);
    if (currentType === null) return null;
    if (currentType === undefined) return undefined;

    // Handle buffer types
    if (currentType instanceof ArrayBuffer) {
      const numValue = Number(value);
      if (isNaN(numValue)) return currentType;

      const oldView = new Uint8Array(currentType);
      const newBuffer = new ArrayBuffer(oldView.length);
      const newView = new Uint8Array(newBuffer);

      // Copy all bytes from old buffer
      newView.set(oldView);

      // Update only the specific byte if editing
      if (propertyName) {
        const index = parseInt(propertyName, 10);
        if (index >= 0 && index < newView.length) {
          newView[index] = numValue & 0xFF;
        }
      }

      return newBuffer;
    }

    if (ArrayBuffer.isView(currentType)) {
      // Handle BigInt arrays separately
      if (currentType instanceof BigInt64Array || currentType instanceof BigUint64Array) {
        try {
          const bigIntValue = BigInt(value);
          const Constructor = Object.getPrototypeOf(currentType).constructor;
          const typedArray = currentType;
          const newArray = new Constructor(typedArray.length);
          for (let i = 0; i < typedArray.length; i++) {
            newArray[i] = typedArray[i];  // Copy all existing values
          }
          if (propertyName) {
            const index = parseInt(propertyName, 10);
            if (index >= 0 && index < newArray.length) {
              newArray[index] = bigIntValue;  // Update only the edited value
            }
          }
          return newArray;
        } catch {
          return currentType;
        }
      }

      // Handle regular TypedArrays
      const numValue = Number(value);
      if (isNaN(numValue)) return currentType;

      const Constructor = Object.getPrototypeOf(currentType).constructor;
      const typedArray = currentType as TypedArray;
      const newArray = new Constructor(typedArray.length);
      for (let i = 0; i < typedArray.length; i++) {
        newArray[i] = typedArray[i];  // Copy all existing values
      }
      if (propertyName) {
        const index = parseInt(propertyName, 10);
        if (index >= 0 && index < newArray.length) {
          newArray[index] = numValue;  // Update only the edited value
        }
      }
      return newArray;
    }

    // Handle RegExp
    if (currentType instanceof RegExp) {
      try {
        const match = /^\/(?<pattern>.*)\/(?<flags>[gimuy]*)$/.exec(value);
        if (match?.groups) {
          return new RegExp(match.groups.pattern, match.groups.flags);
        }
        return new RegExp(value);
      } catch {
        return currentType;
      }
    }

    // Handle Map
    if (currentType instanceof Map) {
      const entries = value
        .slice(1, -1)
        .split(', ')
        .map(entry => {
          const [key, val] = entry.split(' => ');
          return [parseValue(key, ''), parseValue(val, '')] as [unknown, unknown];
        });
      return new Map(entries);
    }

    // Handle Set
    if (currentType instanceof Set) {
      const values = value
        .slice(1, -1)
        .split(', ')
        .map(v => parseValue(v, ''));
      return new Set(values);
    }

    // Handle arrays
    if (Array.isArray(currentType)) {
      return parseArrayValue(value.slice(1, -1));
    }

    // Handle objects
    if (typeof currentType === 'object') {
      const entries = value
        .slice(1, -1)
        .split(', ')
        .map(entry => {
          const [key, val] = entry.split(': ');
          return [key, parseValue(val, '')];
        });
      return Object.fromEntries(entries);
    }

    return value;
  } catch (error) {
    return currentType;
  }
};

const EditableValue = ({ value, onSave, onCancel, name }: EditableValueProps & { name: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(() => {
    let initialValue = '';
    try {
      if (value instanceof Date) {
        initialValue = value.toISOString().slice(0, 16);
      } else if (value instanceof Map || value instanceof Set || value instanceof RegExp ||
        value instanceof Error || value instanceof ArrayBuffer || ArrayBuffer.isView(value) ||
        (typeof value === 'object' && value !== null)) {
        initialValue = formatValue(value);
      } else {
        initialValue = String(value);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(sanitizeErrorMessage(String(error)));
      initialValue = String(value);
    }
    return sanitizeString(initialValue);
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      setEditValue(target.value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      try {
        let newValue: unknown;
        if (value instanceof Date) {
          const date = new Date(editValue);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          newValue = date;
        } else {
          newValue = parseValue(editValue, value, name);
        }
        onSave(newValue);
      } catch (error) {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type={value instanceof Date ? 'datetime-local' : 'text'}
      className="react-scan-input"
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      step={value instanceof Date ? "1" : undefined}  // Allow seconds precision for dates
    />
  );
};

type IterableEntry = [key: string | number, value: unknown];
const PropertyElement = ({
  name,
  value,
  fiber,
  section,
  level,
  parentPath,
  objectPathMap = new WeakMap(),
  changedKeys = new Set(),
  hasCumulativeChanges = false
}: PropertyElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    const currentPath = getPath(
      getDisplayName(fiber.type) ?? 'Unknown',
      section,
      parentPath ?? '',
      name
    );
    return EXPANDED_PATHS.has(currentPath);
  });
  const [isEditing, setIsEditing] = useState(false);

  const currentPath = getPath(
    getDisplayName(fiber.type) ?? 'Unknown',
    section,
    parentPath ?? '',
    name
  );
  const prevValue = lastRendered.get(currentPath);
  const isChanged = prevValue !== undefined && !isEqual(prevValue, value);

  const renderNestedProperties = useCallback((obj: Record<string, unknown> | Array<unknown> | Map<unknown, unknown> | Set<unknown> | ArrayBuffer | DataView | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array) => {
    let entries: Array<IterableEntry>;

    if (obj instanceof ArrayBuffer) {
      const view = new Uint8Array(obj);
      entries = Array.from(view).slice(0, MAX_ARRAY_PREVIEW).map((v, i) => [i, v]);
    } else if (obj instanceof DataView) {
      const view = new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength);
      entries = Array.from(view).slice(0, MAX_ARRAY_PREVIEW).map((v, i) => [i, v]);
    } else if (ArrayBuffer.isView(obj)) {
      if (obj instanceof BigInt64Array || obj instanceof BigUint64Array) {
        entries = Array.from({ length: Math.min(obj.length, MAX_ARRAY_PREVIEW) }, (_, i) => [i, obj[i]]);
      } else {
        entries = Array.from(obj as ArrayLike<number>).slice(0, MAX_ARRAY_PREVIEW).map((v, i) => [i, v]);
      }
    } else if (obj instanceof Map) {
      entries = Array.from(obj.entries()).slice(0, MAX_OBJECT_KEYS).map(([k, v]) => [String(k), v]);
    } else if (obj instanceof Set) {
      entries = Array.from(obj).slice(0, MAX_ARRAY_PREVIEW).map((v, i) => [i, v]);
    } else if (Array.isArray(obj)) {
      entries = obj.slice(0, MAX_ARRAY_PREVIEW).map((value, index) => [index, value]);
    } else {
      entries = Object.entries(obj).slice(0, MAX_OBJECT_KEYS);
    }

    const elements = entries.map(([key, value]) => (
      <PropertyElement
        key={String(key)}
        name={String(key)}
        value={value}
        fiber={fiber}
        section={section}
        level={level + 1}
        parentPath={currentPath}
        objectPathMap={objectPathMap}
        changedKeys={changedKeys}
        hasCumulativeChanges={hasCumulativeChanges || isChanged}
      />
    ));

    // Add "..." element if there are more items
    const totalLength = obj instanceof Map ? obj.size :
      obj instanceof Set ? obj.size :
        ArrayBuffer.isView(obj) ? getArrayLength(obj) :
          Array.isArray(obj) ? obj.length :
            Object.keys(obj).length;

    if (totalLength > entries.length) {
      elements.push(
        <div key="more" className="react-scan-property">
          <div className="react-scan-property-content">
            <div className="react-scan-preview-line">
              <span className="react-scan-key">...</span>
            </div>
          </div>
        </div>
      );
    }

    return elements;
  }, [fiber, section, level, currentPath, objectPathMap, changedKeys, hasCumulativeChanges, isChanged]);

  const valuePreview = useMemo(() => formatValue(value), [value]);

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = section === 'props'
    ? !!overrideProps
    : section === 'state'
      ? !!overrideHookState
      : false;

  const MAX_OBJECT_DEPTH = 100;
  const MAX_COLLECTION_SIZE = 10000;

  const validateObjectUpdate = (
    value: unknown,
    path: Array<string>,
    depth = 0
  ): { isValid: boolean; error?: string } => {
    if (depth > MAX_OBJECT_DEPTH) {
      return { isValid: false, error: 'Maximum object depth exceeded' };
    }

    if (value instanceof Map || value instanceof Set) {
      if (value.size > MAX_COLLECTION_SIZE) {
        return { isValid: false, error: 'Collection size exceeds maximum limit' };
      }
    }

    if (Array.isArray(value)) {
      if (value.length > MAX_COLLECTION_SIZE) {
        return { isValid: false, error: 'Array size exceeds maximum limit' };
      }
    }

    if (value instanceof ArrayBuffer || value instanceof DataView || ArrayBuffer.isView(value)) {
      if (value.byteLength > MAX_COLLECTION_SIZE) {
        return { isValid: false, error: 'Buffer size exceeds maximum limit' };
      }
    }

    // Check for circular references
    const seen = new Set<unknown>();
    const hasCircular = (obj: unknown): boolean => {
      if (obj === null || typeof obj !== 'object') {
        return false;
      }

      if (seen.has(obj)) {
        return true;
      }

      seen.add(obj);

      if (obj instanceof Map) {
        for (const [key, value] of obj.entries()) {
          if (hasCircular(key) || hasCircular(value)) {
            return true;
          }
        }
      } else if (obj instanceof Set) {
        for (const value of obj) {
          if (hasCircular(value)) {
            return true;
          }
        }
      } else if (Array.isArray(obj)) {
        for (const value of obj) {
          if (hasCircular(value)) {
            return true;
          }
        }
      } else {
        for (const value of Object.values(obj)) {
          if (hasCircular(value)) {
            return true;
          }
        }
      }

      seen.delete(obj);
      return false;
    };

    if (hasCircular(value)) {
      return { isValid: false, error: 'Circular reference detected' };
    }

    return { isValid: true };
  };

  const updateNestedValue = (obj: unknown, path: Array<string>, value: unknown): unknown => {
    const validation = validateObjectUpdate(value, path);
    if (!validation.isValid) {
      return obj;
    }

    if (path.length === 0) return value;

    const [key, ...rest] = path;

    try {
      // Special handling for DataView array items
      if (obj instanceof DataView && rest.length === 0) {
        const index = parseInt(key, 10);
        const newBuffer = new ArrayBuffer(obj.byteLength);
        const newView = new DataView(newBuffer);
        const uint8Array = new Uint8Array(obj.buffer);

        // Copy all existing values
        uint8Array.forEach((byte, i) => {
          newView.setUint8(i, byte);
        });

        // Update the specific index with the new byte value
        if (typeof value === 'bigint') {
          newView.setBigInt64(index, value);
        } else {
          newView.setUint8(index, value as number);
        }
        return newView;
      }

      if (obj instanceof Map) {
        const newMap = new Map(obj);
        if (rest.length === 0) {
          newMap.set(key, value);
        } else {
          const currentValue = newMap.get(key);
          newMap.set(key, updateNestedValue(currentValue, rest, value));
        }
        return newMap;
      }

      if (Array.isArray(obj)) {
        const index = parseInt(key, 10);
        const newArray = [...obj];
        if (rest.length === 0) {
          newArray[index] = value;
        } else {
          newArray[index] = updateNestedValue(obj[index], rest, value);
        }
        return newArray;
      }

      if (obj && typeof obj === 'object') {
        if (rest.length === 0) {
          return { ...obj, [key]: value };
        }
        return {
          ...obj,
          [key]: updateNestedValue((obj as any)[key], rest, value)
        };
      }

      return value;
    } catch (error) {
      return obj;
    }
  };

  const handleSave = useCallback((newValue: unknown) => {
    if (isEqual(value, newValue)) {
      setIsEditing(false);
      return;
    }

    if (section === 'props' && overrideProps) {
      tryOrElse(() => {
        if (parentPath) {
          const parts = parentPath.split('.');
          const path = parts.filter(part => part !== 'props' && part !== getDisplayName(fiber.type));
          path.push(name);
          const validation = validateObjectUpdate(newValue, path);
          if (validation.isValid) {
            overrideProps(fiber, path, newValue);
          } else {
            // eslint-disable-next-line no-console
            console.warn(sanitizeErrorMessage(validation.error ?? 'Invalid props update'));
          }
        } else {
          const validation = validateObjectUpdate(newValue, [name]);
          if (validation.isValid) {
            overrideProps(fiber, [name], newValue);
          } else {
            // eslint-disable-next-line no-console
            console.warn(sanitizeErrorMessage(validation.error ?? 'Invalid props update'));
          }
        }
      }, null);
    }

    if (section === 'state' && overrideHookState) {
      tryOrElse(() => {
        if (!parentPath) {
          const stateNames = getStateNames(fiber);
          const namedStateIndex = stateNames.indexOf(name);
          const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
          const validation = validateObjectUpdate(newValue, [name]);
          if (validation.isValid) {
            overrideHookState(fiber, hookId, [], newValue);
          } else {
            // eslint-disable-next-line no-console
            console.warn(sanitizeErrorMessage(validation.error ?? 'Invalid state update'));
          }
        } else {
          const fullPathParts = parentPath.split('.');
          const stateIndex = fullPathParts.indexOf('state');
          if (stateIndex === -1) return;

          const statePath = fullPathParts.slice(stateIndex + 1);
          const baseStateKey = statePath[0];
          const stateNames = getStateNames(fiber);
          const namedStateIndex = stateNames.indexOf(baseStateKey);
          const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';

          // Get current state safely
          const currentState = getCurrentState(fiber);
          if (!currentState || !(baseStateKey in currentState)) {
            // eslint-disable-next-line no-console
            console.warn(sanitizeErrorMessage('Invalid state key'));
            return;
          }

          const currentValue = currentState[baseStateKey];

          // Special handling for ArrayBuffer bytes
          if (currentValue instanceof ArrayBuffer && (/^\d+$/.exec(name))) {
            const oldView = new Uint8Array(currentValue);
            const newBuffer = new ArrayBuffer(oldView.length);
            const newView = new Uint8Array(newBuffer);
            newView.set(oldView);
            const byteIndex = parseInt(name, 10);
            if (byteIndex >= 0 && byteIndex < newView.length) {
              newView[byteIndex] = Number(newValue) & 0xFF;
            }
            overrideHookState(fiber, hookId, [], newBuffer);
            return;
          }

          // Special handling for TypedArrays
          if (ArrayBuffer.isView(currentValue) && (/^\d+$/.exec(name))) {
            const typedArray = currentValue as TypedArray;
            const Constructor = Object.getPrototypeOf(typedArray).constructor;
            const newArray = new Constructor(typedArray.length);

            // Copy all existing values
            for (let i = 0; i < typedArray.length; i++) {
              newArray[i] = typedArray[i];
            }

            // Update only the specific index
            const index = parseInt(name, 10);
            if (index >= 0 && index < newArray.length) {
              if (typedArray instanceof BigInt64Array || typedArray instanceof BigUint64Array) {
                newArray[index] = BigInt(newValue as any);
              } else {
                newArray[index] = Number(newValue);
              }
            }

            overrideHookState(fiber, hookId, [], newArray);
            return;
          }

          const validation = validateObjectUpdate(newValue, statePath.slice(1).concat(name));
          if (validation.isValid) {
            const updatedState = updateNestedValue(currentState[baseStateKey], statePath.slice(1).concat(name), newValue);
            overrideHookState(fiber, hookId, [], updatedState);
          } else {
            // eslint-disable-next-line no-console
            console.warn(sanitizeErrorMessage(validation.error ?? 'Invalid state update'));
          }
        }
      }, null);
    }

    setIsEditing(false);
  }, [value, section, overrideProps, overrideHookState, fiber, name, parentPath]);

  useEffect(() => {
    lastRendered.set(currentPath, value);

    if (isChanged && elementRef.current) {
      flashManager.create(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        flashManager.cleanup(elementRef.current);
      }
    };
  }, [value, isChanged, currentPath]);

  const shouldShowWarning = useMemo(() => {
    const shouldShowChange = !lastRendered.has(currentPath) || !isEqual(lastRendered.get(currentPath), value);

    const isBadRender = level === 0 &&
      shouldShowChange &&
      typeof value === 'object' &&
      value !== null &&
      !isPromise(value);

    return isBadRender;
  }, [level, currentPath, value]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'react-scan-property',
        {
          'react-scan-expandable': isExpandable(value),
          'react-scan-expanded': isExpanded,
        }
      )}
    >
      <div className="react-scan-property-content">
        {isExpandable(value) && (
          <span
            className="react-scan-arrow"
            onClick={() => {
              const newIsExpanded = !isExpanded;
              setIsExpanded(newIsExpanded);
              if (newIsExpanded) {
                EXPANDED_PATHS.add(currentPath);
              } else {
                EXPANDED_PATHS.delete(currentPath);
              }
            }}
          />
        )}
        <div
          className={cn(
            'react-scan-preview-line',
            {
              'react-scan-highlight': isChanged,
            }
          )}
          data-key={name}
          data-section={section}
        >
          {
            shouldShowWarning && (
              <span
                className="react-scan-warning"
                title="This value might cause performance issues"
              >⚠️</span>
            )
          }
          <span className="react-scan-key">
            {name}:&nbsp;
          </span>
          {
            isEditing && isEditableValue(value)
              ? (
                <EditableValue
                  value={value}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                  name={name}
                />
              )
              : (
                <span
                  className="truncate"
                  onClick={() => {
                    if (canEdit && isEditableValue(value)) {
                      setIsEditing(true);
                    }
                  }}
                >
                  {valuePreview}
                </span>
              )
          }
        </div>
        {
          (isExpanded && isExpandable(value)) && (
            <div className="react-scan-nested-object">
              {renderNestedProperties(value)}
            </div>
          )
        }
      </div>
    </div>
  );
};

const PropertySection = ({ title, data, fiber, section }: PropertySectionProps) => {
  const pathMap = useMemo(() => new WeakMap<object, Set<string>>(), []);
  const changedKeys = useMemo(() => {
    switch (section) {
      case 'props':
        return getChangedProps(fiber);
      case 'state':
        return getChangedState(fiber);
      case 'context':
        return getChangedContext(fiber);
      default:
        return new Set<string>();
    }
  }, [fiber, section]);

  const currentData = useMemo(() => {
    switch (section) {
      case 'props':
        return getCurrentProps(fiber);
      case 'state':
        return getCurrentState(fiber) ?? {};
      case 'context':
        return getCurrentContext(fiber);
      default:
        return data;
    }
  }, [fiber, section, data]);

  return (
    <div className="react-scan-section">
      <div>{title}</div>
      {
        Object.entries(currentData ?? {}).map(([key, value]) => (
          <PropertyElement
            key={key}
            name={key}
            value={value}
            fiber={fiber}
            section={section}
            level={0}
            objectPathMap={pathMap}
            changedKeys={changedKeys}
            hasCumulativeChanges={false}
          />
        ))
      }
    </div>
  );
};

const WhatChanged = memo(() => {
  const [isOpen, setIsOpen] = useState(Store.wasDetailsOpen.value);
  const { changes } = inspectorState.value;

  const hasChanges = changes.state.size > 0 || changes.props.size > 0 || changes.context.size > 0;
  if (!hasChanges) {
    return null
  };

  return (
    <details
      open={isOpen}
      style="background-color:#b8860b;color:#ffff00;padding:5px"
      onToggle={(e) => {
        const isOpen = (e.target as HTMLDetailsElement).open;
        setIsOpen(isOpen);
        Store.wasDetailsOpen.value = isOpen;
      }}
    >
      <summary>What changed?</summary>
      {
        changes.state.size > 0 && (
          <>
            <div>State:</div>
            <ul style="list-style-type:disc;padding-left:20px">
              {Array.from(changes.state).map(key => {
                const count = getStateChangeCount(key);
                if (count > 0) {
                  return <li key={key}>{key} ×{count}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ul>
          </>
        )
      }
      {
        changes.props.size > 0 && (
          <>
            <div>Props:</div>
            <ul style="list-style-type:disc;padding-left:20px">
              {Array.from(changes.props).map(key => {
                const count = getPropsChangeCount(key);
                if (count > 0) {
                  return <li key={key}>{key} ×{count}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ul>
          </>
        )
      }
      {
        changes.context.size > 0 && (
          <>
            <div>Context:</div>
            <ul style="list-style-type:disc;padding-left:20px">
              {Array.from(changes.context).map(key => {
                const count = getContextChangeCount(key);
                if (count > 0) {
                  return <li key={key}>{key.replace(/^context\./, '')} ×{count}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ul>
          </>
        )
      }
    </details>
  );
});

const SectionProps = memo(() => {
  const { fiber, current } = inspectorState.value;
  if (!fiber) return null;

  if (Object.keys(current.props).length === 0) {
    return null
  };

  return (
    <PropertySection
      title="Props"
      data={current.props}
      fiber={fiber}
      section="props"
    />
  );
});

const SectionState = memo(() => {
  const { fiber, current } = inspectorState.value;
  if (!fiber) return null;

  return (
    <PropertySection
      title="State"
      data={current.state}
      fiber={fiber}
      section="state"
    />
  );
});

const SectionContext = memo(() => {
  const { fiber } = inspectorState.value;
  if (!fiber) return null;

  const currentContext = useMemo(() => {
    const contexts = getAllFiberContexts(fiber);
    const contextObj: Record<string, unknown> = {};

    contexts.forEach((value, contextName) => {
      const key = `context.${contextName}`;
      contextObj[key] = value.displayValue;
    });

    return contextObj;
  }, [fiber]);

  if (Object.keys(currentContext).length === 0) return null;

  return (
    <PropertySection
      title="Context"
      data={currentContext}
      fiber={fiber}
      section="context"
    />
  );
});

export const cleanup = () => {
  EXPANDED_PATHS.clear();
  flashManager.cleanupAll();
  lastRendered.clear();
  lastInspectedFiber = null;
  resetStateTracking();
};

class InspectorErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
