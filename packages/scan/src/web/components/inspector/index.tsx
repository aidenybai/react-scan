import { signal } from '@preact/signals';
import { getDisplayName } from 'bippy';
import { Component } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import type { Fiber } from 'react-reconciler';
import { Store } from '~core/index';
import { isEqual } from '~core/utils';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { cn, tryOrElse } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { flashManager } from './flash-overlay';
import {
  getChangedContext,
  getChangedProps,
  getChangedState,
  getContextChangeCount,
  getCurrentContext,
  getCurrentProps,
  getCurrentState,
  getPropsChangeCount,
  getStateChangeCount,
  getStateNames,
  resetStateTracking,
} from './overlay/utils';
import { getCompositeComponentFromElement, getOverrideMethods } from './utils';

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

type InspectableValue =
  | Record<string, unknown>
  | Array<unknown>
  | Map<unknown, unknown>
  | Set<unknown>
  | ArrayBuffer
  | DataView
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

interface PropertyElementProps {
  name: string;
  value: unknown;
  section: string;
  level: number;
  parentPath?: string;
  objectPathMap?: WeakMap<object, Set<string>>;
  changedKeys?: Set<string>;
  allowEditing?: boolean;
}

interface PropertySectionProps {
  title: string;
  section: 'props' | 'state' | 'context';
}

interface EditableValueProps {
  value: unknown;
  onSave: (newValue: unknown) => void;
  onCancel: () => void;
}

type IterableEntry = [key: string | number, value: unknown];

const EXPANDED_PATHS = new Set<string>();
const lastRendered = new Map<string, unknown>();
let lastInspectedFiber: Fiber | null = null;

const THROTTLE_MS = 16;
const DEBOUNCE_MS = 150;

const inspectorState = signal<InspectorState>({
  fiber: null,
  changes: {
    state: new Set(),
    props: new Set(),
    context: new Set(),
  },
  current: {
    state: {},
    props: {},
    context: {},
  },
});

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

const isExpandable = (value: unknown): value is InspectableValue => {
  if (value === null || typeof value !== 'object' || isPromise(value)) {
    return false;
  }

  if (value instanceof ArrayBuffer) {
    return true;
  }

  if (value instanceof DataView) {
    return true;
  }

  if (ArrayBuffer.isView(value)) {
    return true;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Object.keys(value).length > 0;
};

const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    !!value &&
    (value instanceof Promise || (typeof value === 'object' && 'then' in value))
  );
};

const isEditableValue = (value: unknown, parentPath?: string): boolean => {
  if (value == null) return true;

  if (isPromise(value)) return false;

  if (typeof value === 'function') {
    return false;
  }

  if (parentPath) {
    const parts = parentPath.split('.');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      const obj = lastRendered.get(currentPath);
      if (
        obj instanceof DataView ||
        obj instanceof ArrayBuffer ||
        ArrayBuffer.isView(obj)
      ) {
        return false;
      }
    }
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return true;
    case 'object':
      if (
        value instanceof Date ||
        value instanceof RegExp ||
        value instanceof Error
      ) {
        return true;
      }
    default:
      return false;
  }
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

const getArrayLength = (obj: ArrayBufferView): number => {
  if (obj instanceof DataView) {
    return obj.byteLength;
  }
  return (obj as TypedArray).length;
};

const sanitizeString = (value: string): string => {
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 50000);
};

const sanitizeErrorMessage = (error: string): string => {
  return error
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const formatValue = (value: unknown): string => {
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    case 'symbol':
      return value.toString();
    case 'object': {
      if (!value) {
        return 'null';
      }
      switch (true) {
        case value instanceof Map:
          return `Map(${value.size})`;
        case value instanceof Set:
          return `Set(${value.size})`;
        case value instanceof Date:
          return value
            .toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
            .replace(/[/,-]/g, '.');
        case value instanceof RegExp:
          return 'RegExp';
        case value instanceof Error:
          return 'Error';
        case value instanceof ArrayBuffer:
          return `ArrayBuffer(${value.byteLength})`;
        case value instanceof DataView:
          return `DataView(${value.byteLength})`;
        case ArrayBuffer.isView(value):
          return `${value.constructor.name}(${getArrayLength(value)})`;
        case Array.isArray(value):
          return `Array(${value.length})`;
        case isPromise(value):
          return 'Promise';
        default: {
          const keys = Object.keys(value);
          if (keys.length <= 5) return `{${keys.join(', ')}}`;
          return `{${keys.slice(0, 5).join(', ')}, ...${keys.length - 5}}`;
        }
      }
    }
    default:
      return typeof value;
  }
};

const formatForClipboard = (value: unknown): string => {
  try {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (isPromise(value)) return 'Promise';

    switch (true) {
      case value instanceof Date:
        return value.toISOString();
      case value instanceof RegExp:
        return value.toString();
      case value instanceof Error:
        return `${value.name}: ${value.message}`;
      case value instanceof Map:
        return JSON.stringify(Array.from(value.entries()), null, 2);
      case value instanceof Set:
        return JSON.stringify(Array.from(value), null, 2);
      case value instanceof DataView:
        return JSON.stringify(
          Array.from(new Uint8Array(value.buffer)),
          null,
          2,
        );
      case value instanceof ArrayBuffer:
        return JSON.stringify(Array.from(new Uint8Array(value)), null, 2);
      case ArrayBuffer.isView(value) && 'length' in value:
        return JSON.stringify(
          Array.from(value as unknown as ArrayLike<number>),
          null,
          2,
        );
      case Array.isArray(value):
        return JSON.stringify(value, null, 2);
      case typeof value === 'object':
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  } catch {
    return String(value);
  }
};

const parseArrayValue = (value: string): Array<unknown> => {
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

const parseValue = (value: string, currentType: unknown): unknown => {
  try {
    switch (typeof currentType) {
      case 'number':
        return Number(value);
      case 'string':
        return value;
      case 'boolean':
        return value === 'true';
      case 'bigint':
        return BigInt(value);
      case 'undefined':
        return undefined;
      case 'object': {
        if (!currentType) {
          return null;
        }

        if (Array.isArray(currentType)) {
          return parseArrayValue(value.slice(1, -1));
        }

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

        if (currentType instanceof Map) {
          const entries = value
            .slice(1, -1)
            .split(', ')
            .map((entry) => {
              const [key, val] = entry.split(' => ');
              return [parseValue(key, ''), parseValue(val, '')] as [
                unknown,
                unknown,
              ];
            });
          return new Map(entries);
        }

        if (currentType instanceof Set) {
          const values = value
            .slice(1, -1)
            .split(', ')
            .map((v) => parseValue(v, ''));
          return new Set(values);
        }
        const entries = value
          .slice(1, -1)
          .split(', ')
          .map((entry) => {
            const [key, val] = entry.split(': ');
            return [key, parseValue(val, '')];
          });
        return Object.fromEntries(entries);
      }
    }

    return value;
  } catch {
    return currentType;
  }
};

const detectValueType = (
  value: string,
): {
  type: 'string' | 'number' | 'undefined' | 'null' | 'boolean';
  value: unknown;
} => {
  const trimmed = value.trim();

  switch (trimmed) {
    case 'undefined':
      return { type: 'undefined', value: undefined };
    case 'null':
      return { type: 'null', value: null };
    case 'true':
      return { type: 'boolean', value: true };
    case 'false':
      return { type: 'boolean', value: false };
  }

  if (/^".*"$/.test(trimmed)) {
    return { type: 'string', value: trimmed.slice(1, -1) };
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return { type: 'number', value: Number(trimmed) };
  }

  return { type: 'string', value: `"${trimmed}"` };
};

const formatInitialValue = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
};

const EditableValue = ({ value, onSave, onCancel }: EditableValueProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(() => {
    let initialValue = '';
    try {
      if (value instanceof Date) {
        initialValue = value.toISOString().slice(0, 16);
      } else if (
        value instanceof Map ||
        value instanceof Set ||
        value instanceof RegExp ||
        value instanceof Error ||
        value instanceof ArrayBuffer ||
        ArrayBuffer.isView(value) ||
        (typeof value === 'object' && value !== null)
      ) {
        initialValue = formatValue(value);
      } else {
        initialValue = formatInitialValue(value);
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

    if (typeof value === 'string') {
      inputRef.current?.setSelectionRange(1, inputRef.current.value.length - 1);
    } else {
      inputRef.current?.select();
    }
  }, [value]);

  const handleChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target) {
      setEditValue(target.value);
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      try {
        let newValue: unknown;
        if (value instanceof Date) {
          const date = new Date(editValue);
          if (Number.isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          newValue = date;
        } else {
          const detected = detectValueType(editValue);
          newValue = detected.value;
        }
        onSave(newValue);
      } catch {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type={value instanceof Date ? 'datetime-local' : 'text'}
      className="react-scan-input flex-1"
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      step={value instanceof Date ? 1 : undefined}
    />
  );
};

const updateNestedValue = (
  obj: unknown,
  path: Array<string>,
  value: unknown,
): unknown => {
  try {
    if (path.length === 0) return value;

    const [key, ...rest] = path;

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
      const index = Number.parseInt(key, 10);
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
        [key]: updateNestedValue(
          (obj as Record<string, unknown>)[key],
          rest,
          value,
        ),
      };
    }

    return value;
  } catch {
    return obj;
  }
};

const PropertyElement = ({
  name,
  value,
  section,
  level,
  parentPath,
  objectPathMap = new WeakMap(),
  changedKeys = new Set(),
  allowEditing = true,
}: PropertyElementProps) => {
  const { fiber } = inspectorState.value;

  const refElement = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    const currentPath = getPath(
      getDisplayName(fiber?.type) ?? 'Unknown',
      section,
      parentPath ?? '',
      name,
    );
    return EXPANDED_PATHS.has(currentPath);
  });
  const [isEditing, setIsEditing] = useState(false);

  const currentPath = getPath(
    getDisplayName(fiber?.type) ?? 'Unknown',
    section,
    parentPath ?? '',
    name,
  );

  const prevValue = lastRendered.get(currentPath);
  const isChanged = prevValue !== undefined && !isEqual(prevValue, value);

  const renderNestedProperties = useCallback(
    (obj: InspectableValue) => {
      let entries: Array<IterableEntry>;

      if (obj instanceof ArrayBuffer) {
        const view = new Uint8Array(obj);
        entries = Array.from(view).map((v, i) => [i, v]);
      } else if (obj instanceof DataView) {
        const view = new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength);
        entries = Array.from(view).map((v, i) => [i, v]);
      } else if (ArrayBuffer.isView(obj)) {
        if (obj instanceof BigInt64Array || obj instanceof BigUint64Array) {
          entries = Array.from({ length: obj.length }, (_, i) => [i, obj[i]]);
        } else {
          entries = Array.from(obj as ArrayLike<number>).map((v, i) => [i, v]);
        }
      } else if (obj instanceof Map) {
        entries = Array.from(obj.entries()).map(([k, v]) => [String(k), v]);
      } else if (obj instanceof Set) {
        entries = Array.from(obj).map((v, i) => [i, v]);
      } else if (Array.isArray(obj)) {
        entries = obj.map((value, index) => [index, value]);
      } else {
        entries = Object.entries(obj);
      }

      const canEditChildren = !(
        obj instanceof DataView ||
        obj instanceof ArrayBuffer ||
        ArrayBuffer.isView(obj)
      );

      return entries.map(([key, value]) => (
        <PropertyElement
          key={String(key)}
          name={String(key)}
          value={value}
          section={section}
          level={level + 1}
          parentPath={currentPath}
          objectPathMap={objectPathMap}
          changedKeys={changedKeys}
          allowEditing={canEditChildren}
        />
      ));
    },
    [section, level, currentPath, objectPathMap, changedKeys],
  );

  const valuePreview = useMemo(() => formatValue(value), [value]);

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = useMemo(() => {
    return (
      allowEditing &&
      (section === 'props'
        ? !!overrideProps && name !== 'children'
        : section === 'state'
          ? !!overrideHookState
          : false)
    );
  }, [section, overrideProps, overrideHookState, allowEditing, name]);

  useEffect(() => {
    lastRendered.set(currentPath, value);

    const isSameComponentType = lastInspectedFiber?.type === fiber?.type;
    const isFirstRender = !lastRendered.has(currentPath);
    const shouldFlash =
      isChanged &&
      refElement.current &&
      prevValue !== undefined &&
      !isSameComponentType &&
      !isFirstRender;

    if (shouldFlash && refElement.current) {
      flashManager.create(refElement.current);
    }

    return () => {
      if (refElement.current) {
        flashManager.cleanup(refElement.current);
      }
    };
  }, [value, isChanged, currentPath, prevValue, fiber?.type]);

  const shouldShowWarning = useMemo(() => {
    const shouldShowChange =
      !lastRendered.has(currentPath) ||
      !isEqual(lastRendered.get(currentPath), value);

    const isBadRender =
      level === 0 &&
      shouldShowChange &&
      typeof value === 'object' &&
      value !== null &&
      !isPromise(value);

    return isBadRender;
  }, [level, currentPath, value]);

  const clipboardText = useMemo(() => formatForClipboard(value), [value]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((state) => {
      const newIsExpanded = !state;
      if (newIsExpanded) {
        EXPANDED_PATHS.add(currentPath);
      } else {
        EXPANDED_PATHS.delete(currentPath);
      }
      return newIsExpanded;
    });
  }, [currentPath]);

  const handleEdit = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
    }
  }, [canEdit]);

  const handleSave = useCallback(
    (newValue: unknown) => {
      if (isEqual(value, newValue)) {
        setIsEditing(false);
        return;
      }

      if (section === 'props' && overrideProps) {
        tryOrElse(() => {
          if (!fiber) return;

          if (parentPath) {
            const parts = parentPath.split('.');
            const path = parts.filter(
              (part) => part !== 'props' && part !== getDisplayName(fiber.type),
            );
            path.push(name);
            overrideProps(fiber, path, newValue);
          } else {
            overrideProps(fiber, [name], newValue);
          }
        }, null);
      }

      if (section === 'state' && overrideHookState) {
        tryOrElse(() => {
          if (!fiber) return;

          if (!parentPath) {
            const stateNames = getStateNames(fiber);
            const namedStateIndex = stateNames.indexOf(name);
            const hookId =
              namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
            overrideHookState(fiber, hookId, [], newValue);
          } else {
            const fullPathParts = parentPath.split('.');
            const stateIndex = fullPathParts.indexOf('state');
            if (stateIndex === -1) return;

            const statePath = fullPathParts.slice(stateIndex + 1);
            const baseStateKey = statePath[0];
            const stateNames = getStateNames(fiber);
            const namedStateIndex = stateNames.indexOf(baseStateKey);
            const hookId =
              namedStateIndex !== -1 ? namedStateIndex.toString() : '0';

            const currentState = getCurrentState(fiber);
            if (!currentState || !(baseStateKey in currentState)) {
              // eslint-disable-next-line no-console
              console.warn(sanitizeErrorMessage('Invalid state key'));
              return;
            }

            const updatedState = updateNestedValue(
              currentState[baseStateKey],
              statePath.slice(1).concat(name),
              newValue,
            );
            overrideHookState(fiber, hookId, [], updatedState);
          }
        }, null);
      }

      setIsEditing(false);
    },
    [value, section, overrideProps, overrideHookState, fiber, name, parentPath],
  );

  const checkCircularInValue = useMemo((): boolean => {
    if (!value || typeof value !== 'object' || isPromise(value)) return false;

    return 'type' in value && value.type === 'circular';
  }, [value]);

  if (checkCircularInValue) {
    return (
      <div className="react-scan-property">
        <div className="react-scan-property-content">
          <div className="react-scan-preview-line">
            <div className="react-scan-key">{name}:</div>
            <span className="text-yellow-500">[Circular Reference]</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={refElement} className="react-scan-property">
      <div className="react-scan-property-content">
        {isExpandable(value) && (
          <button
            type="button"
            onClick={() => handleToggleExpand()}
            onKeyDown={(e) => e.key === 'Enter' && handleToggleExpand()}
            className="react-scan-arrow"
          >
            <Icon
              name="icon-chevron-right"
              size={12}
              className={cn({
                'rotate-90': isExpanded,
              })}
            />
          </button>
        )}
        <div
          className={cn('group', 'react-scan-preview-line', {
            'react-scan-highlight': isChanged,
          })}
        >
          {shouldShowWarning && (
            <Icon name="icon-alert" className="text-yellow-500" size={12} />
          )}
          <div className="react-scan-key">{name}:</div>
          {isEditing && isEditableValue(value, parentPath) ? (
            <EditableValue
              value={value}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <button type="button" className="truncate" onClick={handleEdit}>
              {valuePreview}
            </button>
          )}
          <CopyToClipboard
            text={clipboardText}
            className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
          </CopyToClipboard>
        </div>
        {isExpandable(value) && isExpanded && (
          <div className="react-scan-nested">
            {renderNestedProperties(value)}
          </div>
        )}
      </div>
    </div>
  );
};

const PropertySection = ({ title, section }: PropertySectionProps) => {
  const { current, changes } = inspectorState.value;

  const pathMap = useMemo(() => new WeakMap<object, Set<string>>(), []);
  const changedKeys = useMemo(() => {
    switch (section) {
      case 'props':
        return changes.props;
      case 'state':
        return changes.state;
      case 'context':
        return changes.context;
      default:
        return new Set<string>();
    }
  }, [section, changes]);

  const currentData = useMemo(() => {
    let result: Record<string, unknown> | undefined;
    switch (section) {
      case 'props':
        result = current.props;
        break;
      case 'state':
        result = current.state;
        break;
      case 'context':
        result = current.context;
        break;
    }
    return result || {};
  }, [section, current.props, current.state, current.context]);

  if (!currentData || Object.keys(currentData).length === 0) {
    return null;
  }

  return (
    <div className="react-scan-section">
      <div>{title}</div>
      {Object.entries(currentData).map(([key, value]) => (
        <PropertyElement
          key={key}
          name={key}
          value={value}
          section={section}
          level={0}
          objectPathMap={pathMap}
          changedKeys={changedKeys}
        />
      ))}
    </div>
  );
};

const WhatChanged = constant(() => {
  const [isExpanded, setIsExpanded] = useState(Store.wasDetailsOpen.value);
  const [shouldShow, setShouldShow] = useState(false);
  const { changes } = inspectorState.value;
  const timerRef = useRef<TTimer>();

  const hasChanges =
    changes.state.size > 0 ||
    changes.props.size > 0 ||
    changes.context.size > 0;

  useEffect(() => {
    if (hasChanges) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShouldShow(true);
      }, 32); // Two frames delay
    } else {
      setShouldShow(false);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [hasChanges]);

  if (!hasChanges || !shouldShow) {
    return null;
  }

  const handleToggle = useCallback(() => {
    setIsExpanded((state) => {
      Store.wasDetailsOpen.value = !state;
      return !state;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={handleToggle}
      onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
      className="flex w-full flex-col bg-yellow-600 px-1 py-2 text-left text-white"
    >
      <div className="flex items-center">
        <span className="flex w-8 items-center justify-center">
          <Icon
            name="icon-chevron-right"
            size={12}
            className={cn({
              'rotate-90': isExpanded,
            })}
          />
        </span>
        What changed?
      </div>
      <div
        className={cn('react-scan-expandable pl-8 flex-1', {
          'react-scan-expanded': isExpanded,
        })}
      >
        <div className="overflow-hidden">
          {changes.state.size > 0 && (
            <>
              <div>State:</div>
              <ul style="list-style-type:disc;padding-left:20px">
                {Array.from(changes.state)
                  .map((key) => {
                    const count = getStateChangeCount(key);
                    if (count > 0) {
                      return (
                        <li key={key}>
                          {key} ×{count}
                        </li>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </ul>
            </>
          )}
          {changes.props.size > 0 && (
            <>
              <div>Props:</div>
              <ul style="list-style-type:disc;padding-left:20px">
                {Array.from(changes.props)
                  .map((key) => {
                    const count = getPropsChangeCount(key);
                    if (count > 0) {
                      return (
                        <li key={key}>
                          {key} ×{count}
                        </li>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </ul>
            </>
          )}
          {changes.context.size > 0 && (
            <>
              <div>Context:</div>
              <ul style="list-style-type:disc;padding-left:20px">
                {Array.from(changes.context)
                  .map((key) => {
                    const count = getContextChangeCount(key);
                    if (count > 0) {
                      return (
                        <li key={key}>
                          {key.replace(/^context\./, '')} ×{count}
                        </li>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </ul>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

export const Inspector = constant(() => {
  useEffect(() => {
    let rafId: ReturnType<typeof requestAnimationFrame>;
    let debounceTimer: ReturnType<typeof setTimeout>;
    let lastUpdateTime = 0;
    let isProcessing = false;
    let pendingFiber: Fiber | null = null;

    const updateInspectorState = (fiber: Fiber) => {
      const isNewComponent =
        !lastInspectedFiber || lastInspectedFiber.type !== fiber.type;
      if (isNewComponent) {
        resetStateTracking();
      }

      inspectorState.value = {
        fiber,
        changes: {
          props: getChangedProps(fiber),
          state: getChangedState(fiber),
          context: getChangedContext(fiber),
        },
        current: {
          state: getCurrentState(fiber),
          props: getCurrentProps(fiber),
          context: getCurrentContext(fiber),
        },
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

      const { parentCompositeFiber } = getCompositeComponentFromElement(
        state.focusedDomElement,
      );
      if (!parentCompositeFiber) return;

      processFiberUpdate(parentCompositeFiber);
    });

    const unSubReport = Store.lastReportTime.subscribe(() => {
      if (isProcessing) return;

      const inspectState = Store.inspectState.value;
      if (inspectState.kind !== 'focused') return;

      const element = inspectState.focusedDomElement;
      const { parentCompositeFiber } =
        getCompositeComponentFromElement(element);

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

  return (
    <InspectorErrorBoundary>
      <div className="react-scan-inspector">
        <WhatChanged />
        <PropertySection title="Props" section="props" />
        <PropertySection title="State" section="state" />
        <PropertySection title="Context" section="context" />
      </div>
    </InspectorErrorBoundary>
  );
});

export const replayComponent = async (fiber: Fiber): Promise<void> => {
  try {
    const { overrideProps, overrideHookState } = getOverrideMethods();
    if (!overrideProps || !overrideHookState || !fiber) return;

    const currentProps = fiber.memoizedProps || {};
    for (const key of Object.keys(currentProps)) {
      try {
        overrideProps(fiber, [key], currentProps[key]);
      } catch {
        // Silently ignore prop override errors
      }
    }

    const state = getCurrentState(fiber) ?? {};
    for (const key of Object.keys(state)) {
      try {
        const stateNames = getStateNames(fiber);
        const namedStateIndex = stateNames.indexOf(key);
        const hookId =
          namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
        overrideHookState(fiber, hookId, [], state[key]);
      } catch {
        // Silently ignore state override errors
      }
    }

    let child = fiber.child;
    while (child) {
      await replayComponent(child);
      child = child.sibling;
    }
  } catch {
    // Silently ignore replay errors
  }
};
