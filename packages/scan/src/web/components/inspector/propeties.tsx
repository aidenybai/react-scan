import { signal } from '@preact/signals';
import { type Fiber, getDisplayName, getFiberId } from 'bippy';
import { Component } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import {
  ChangesListener,
  ChangesPayload,
  ContextChange,
  FunctionalComponentStateChange,
  PropsChange,
  Store,
} from '~core/index';
import { isEqual } from '~core/utils';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { signalIsSettingsOpen } from '~web/state';
import { cn, tryOrElse } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { globalInspectorState, inspectorState } from '.';
import { DiffValueView } from './diff-value';
import { flashManager } from './flash-overlay';
import {
  type InspectorData,
  collectInspectorData,
  getCurrentFiberState,
  getStateNames,
  isPromise,
  resetStateTracking,
} from './overlay/utils';
import {
  detectValueType,
  formatForClipboard,
  formatFunctionPreview,
  formatInitialValue,
  formatPath,
  formatValue,
  formatValuePreview,
  getCompositeFiberFromElement,
  getObjectDiff,
  getOverrideMethods,
  getPath,
  isEditableValue,
  isExpandable,
  sanitizeErrorMessage,
  sanitizeString,
  updateNestedValue,
} from './utils';

interface ValueMetadata {
  type: string;
  displayValue: string;
  value?: unknown;
  size?: number;
  length?: number;
  byteLength?: number;
  entries?: Record<string, ValueMetadata>;
  items?: Array<ValueMetadata>;
}
interface PropertyElementProps {
  name: string;
  value: unknown | ValueMetadata;
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

interface ContextInfo {
  value: unknown;
  displayName?: string;
  contextType: any;
}

interface StateItem {
  name: string;
  value: unknown;
}

export const EditableValue = ({
  value,
  onSave,
  onCancel,
}: EditableValueProps) => {
  const refInput = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
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
    } catch {
      initialValue = String(value);
    }
    const sanitizedValue = sanitizeString(initialValue);
    setEditValue(sanitizedValue);

    requestAnimationFrame(() => {
      if (!refInput.current) return;
      refInput.current.focus();
      if (typeof value === 'string') {
        refInput.current.setSelectionRange(1, sanitizedValue.length - 1);
      } else {
        refInput.current.select();
      }
    });
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
      e.stopImmediatePropagation();
      onCancel();
    }
  };

  return (
    <input
      ref={refInput}
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

export const PropertyElement = ({
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

  const currentPath = getPath(
    (fiber?.type && getDisplayName(fiber.type)) ?? 'Unknown',
    section,
    parentPath ?? '',
    name,
  );
  const [isExpanded, setIsExpanded] = useState(
    globalInspectorState.expandedPaths.has(currentPath),
  );
  const [isEditing, setIsEditing] = useState(false);

  const prevValue = globalInspectorState.lastRendered.get(currentPath);
  const isChanged = !isEqual(prevValue, value);

  useEffect(() => {
    if (name === 'children') {
      return;
    }
    if (section === 'context') {
      // we avoid flashing context purple to avoid confusion to user that this causes a render
      // it may be the case context changes but a fiber does not a depend on it, and the fiber is memoized
      /**
       * we avoid flashing context purple to avoid confusion to user that this causes a render.
       * It may be the case context changes, but a fiber does not a depend on it, and the fiber is memoized
       *
       * To add purple flashes correctly, we should distribute the value to the store used in whats-changed and read those values
       * here to determine when to flash
       */
      return;
    }

    const isFirstRender = !globalInspectorState.lastRendered.has(currentPath);
    const shouldFlash = isChanged && refElement.current && !isFirstRender;

    globalInspectorState.lastRendered.set(currentPath, value);

    if (shouldFlash && refElement.current && level === 0) {
      flashManager.create(refElement.current);
    }
  }, [value, isChanged, currentPath, level, name, section]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prevState: boolean) => {
      const newIsExpanded = !prevState;
      if (newIsExpanded) {
        globalInspectorState.expandedPaths.add(currentPath);
      } else {
        globalInspectorState.expandedPaths.delete(currentPath);
      }
      return newIsExpanded;
    });
  }, [currentPath]);

  const valuePreview = useMemo(() => {
    if (typeof value === 'object' && value !== null) {
      if ('displayValue' in value) {
        return String(value.displayValue);
      }
    }
    return formatValue(value);
  }, [value]);

  const clipboardText = useMemo(() => {
    if (typeof value === 'object' && value !== null) {
      if ('value' in value) {
        return String(formatForClipboard(value.value));
      }
      if ('displayValue' in value) {
        return String(value.displayValue);
      }
    }
    return String(formatForClipboard(value));
  }, [value]);

  const isExpandableValue = useMemo(() => {
    if (!value || typeof value !== 'object') return false;

    if ('type' in value) {
      const metadata = value as ValueMetadata;
      switch (metadata.type) {
        case 'array':
        case 'Map':
        case 'Set':
          return (metadata.size ?? metadata.length ?? 0) > 0;
        case 'object':
          return (metadata.size ?? 0) > 0;
        case 'ArrayBuffer':
        case 'DataView':
          return (metadata.byteLength ?? 0) > 0;
        case 'circular':
        case 'promise':
        case 'function':
        case 'error':
          return false;
        default:
          if ('entries' in metadata || 'items' in metadata) {
            return true;
          }
          return false;
      }
    }

    return isExpandable(value);
  }, [value]);

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

  const isBadRender = useMemo(() => {
    const isFirstRender = !globalInspectorState.lastRendered.has(currentPath);

    if (isFirstRender) {
      if (typeof value === 'function') {
        return true;
      }

      if (typeof value !== 'object') {
        return false;
      }
    }

    const shouldShowChange =
      !isFirstRender ||
      !isEqual(globalInspectorState.lastRendered.get(currentPath), value);

    const isBadRender = level === 0 && shouldShowChange && !isPromise(value);

    return isBadRender;
  }, [currentPath, level, value]);

  const handleEdit = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
    }
  }, [canEdit]);

  const handleSave = useCallback(
    (newValue: unknown) => {
      setIsEditing(false);

      if (section === 'state') {
        const fiber = inspectorState.value.fiber;
        if (!fiber) return;

        const statePath = name.split('.');
        const baseStateKey = statePath[0];
        const currentState = getCurrentFiberState(fiber);
        if (!currentState || !Array.isArray(currentState)) return;

        // Find the state item by name and update its value
        const updatedState = currentState.map((item: StateItem) => {
          if (item.name === baseStateKey) {
            if (statePath.length === 1) {
              return { ...item, value: newValue };
            } else {
              return {
                ...item,
                value: updateNestedValue(
                  item.value,
                  statePath.slice(1),
                  newValue,
                ),
              };
            }
          }
          return item;
        });

        const { overrideHookState } = getOverrideMethods();
        if (!overrideHookState) return;

        overrideHookState(fiber, baseStateKey, [], updatedState);
      }
    },
    [name, section],
  );

  const checkCircularInValue = useMemo((): boolean => {
    if (!value || typeof value !== 'object' || isPromise(value)) return false;

    return 'type' in value && value.type === 'circular';
  }, [value]);

  const renderNestedProperties = useCallback(
    (obj: unknown): preact.ComponentChildren => {
      if (!obj || typeof obj !== 'object') return null;

      if ('type' in obj) {
        const metadata = obj as ValueMetadata;
        if ('entries' in metadata && metadata.entries) {
          const entries = Object.entries(metadata.entries);
          if (entries.length === 0) return null;

          return (
            <div className="react-scan-nested">
              {entries.map(([key, val]) => (
                <PropertyElement
                  key={`${currentPath}-entry-${key}`}
                  name={key}
                  value={val}
                  section={section}
                  level={level + 1}
                  parentPath={currentPath}
                  objectPathMap={objectPathMap}
                  changedKeys={changedKeys}
                  allowEditing={allowEditing}
                />
              ))}
            </div>
          );
        }

        if ('items' in metadata && Array.isArray(metadata.items)) {
          if (metadata.items.length === 0) return null;
          return (
            <div className="react-scan-nested">
              {metadata.items.map((item, i) => {
                const itemKey = `${currentPath}-item-${item.type}-${i}`;
                return (
                  <PropertyElement
                    key={itemKey}
                    name={`${i}`}
                    value={item}
                    section={section}
                    level={level + 1}
                    parentPath={currentPath}
                    objectPathMap={objectPathMap}
                    changedKeys={changedKeys}
                    allowEditing={allowEditing}
                  />
                );
              })}
            </div>
          );
        }
        return null;
      }

      let entries: Array<[key: string | number, value: unknown]>;

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
          const typedArray = obj as unknown as ArrayLike<number>;
          entries = Array.from(typedArray).map((v, i) => [i, v]);
        }
      } else if (obj instanceof Map) {
        entries = Array.from(obj.entries()).map(([k, v]) => [String(k), v]);
      } else if (obj instanceof Set) {
        entries = Array.from(obj).map((v, i) => [i, v]);
      } else if (Array.isArray(obj)) {
        entries = obj.map((value, index) => [`${index}`, value]);
      } else {
        entries = Object.entries(obj);
      }

      if (entries.length === 0) return null;

      const canEditChildren = !(
        obj instanceof DataView ||
        obj instanceof ArrayBuffer ||
        ArrayBuffer.isView(obj)
      );

      return (
        <div className="react-scan-nested">
          {entries.map(([key, val]) => {
            const itemKey = `${currentPath}-${typeof key === 'number' ? `item-${key}` : key}`;
            return (
              <PropertyElement
                key={itemKey}
                name={String(key)}
                value={val}
                section={section}
                level={level + 1}
                parentPath={currentPath}
                objectPathMap={objectPathMap}
                changedKeys={changedKeys}
                allowEditing={canEditChildren}
              />
            );
          })}
        </div>
      );
    },
    [section, level, currentPath, objectPathMap, changedKeys, allowEditing],
  );

  // this no longer works but its fine
  const renderMemoizationIcon = useMemo(() => {
    if (name === 'children') {
      return;
    }
    // if (changedKeys.has(`${name}:memoized`)) {
    //   return <Icon name="icon-shield" className="text-green-600" size={14} />;
    // }
    if (changedKeys.has(`${name}:unmemoized`)) {
      return <Icon name="icon-flame" className="text-red-500" size={14} />;
    }
    return null;
  }, [changedKeys, name]);

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
        {isExpandableValue && (
          <button
            type="button"
            onClick={handleToggleExpand}
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
          {/* {isBadRender &&
            !changedKeys.has(`${name}:memoized`) &&
            !changedKeys.has(`${name}:unmemoized`) && (
              <Icon
                name="icon-bell-ring"
                className="text-yellow-500"
                size={14}
              />
            )} */}
          {renderMemoizationIcon}
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
        <div
          className={cn('react-scan-expandable', {
            'react-scan-expanded': isExpanded,
          })}
        >
          {isExpandableValue && isExpanded && (
            <div className="react-scan-nested">
              {renderNestedProperties(value)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PropertySection = ({ title, section }: PropertySectionProps) => {
  const { fiberProps, fiberState, fiberContext } = inspectorState.value;
  const [isExpanded, setIsExpanded] = useState(true);


  const pathMap = useMemo(() => new WeakMap<object, Set<string>>(), []);
  const { currentData, changedKeys } = useMemo(() => {
    switch (section) {
      case 'props':
        return {
          currentData: fiberProps.current,
          changedKeys: fiberProps.changes,
        };
      case 'state':
        // State is now an array of {name, value} pairs
        return {
          currentData: fiberState.current,
          changedKeys: fiberState.changes,
        };
      case 'context':
        // Transform context data to use displayName as key
        return {
          currentData: fiberContext.current,
          changedKeys: fiberContext.changes,
        };
      default:
        return {
          currentData: [],
          changedKeys: new Set<string>(),
        };
    }
  }, [
    section,
    fiberState.current,
    fiberState.changes,
    fiberProps.current,
    fiberProps.changes,
    fiberContext.current,
    fiberContext.changes,
  ]);

  if (
    !currentData ||
    (Array.isArray(currentData)
      ? currentData.length === 0
      : Object.keys(currentData).length === 0)
  ) {
    return null;
  }

  const propertyCount = Array.isArray(currentData)
    ? currentData.length
    : Object.keys(currentData).length;

  return (
    <div className="react-scan-section">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full"
      >
        <Icon
          name="icon-chevron-right"
          size={12}
          className={cn({
            'rotate-90': isExpanded,
          })}
        />
        <span className="ml-1">
          {title} {!isExpanded && propertyCount > 0 && `(${propertyCount})`}
        </span>
      </button>
      <div
        className={cn('react-scan-expandable', {
          'react-scan-expanded': isExpanded,
        })}
      >
        <div>
          {Array.isArray(currentData)
            ? currentData.map(({ name, value }) => (
                <PropertyElement
                  key={name}
                  name={name}
                  value={value}
                  section={section}
                  level={0}
                  objectPathMap={pathMap}
                  changedKeys={changedKeys}
                />
              ))
            : Object.entries(currentData).map(([key, value]) => (
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
      </div>
    </div>
  );
};
