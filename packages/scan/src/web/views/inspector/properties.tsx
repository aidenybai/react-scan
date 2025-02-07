import { getDisplayName } from 'bippy';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { isEqual } from '~core/utils';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { useMergedRefs } from '~web/hooks/use-merged-refs';
import { cn, tryOrElse } from '~web/utils/helpers';
import { globalInspectorState } from '.';
import { flashManager } from './flash-overlay';
import { timelineState } from './states';
import {
  detectValueType,
  formatForClipboard,
  formatInitialValue,
  formatValue,
  getOverrideMethods,
  getPath,
  isEditableValue,
  isExpandable,
  isPromise,
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
  changedKeys?: Set<string | number>;
  allowEditing?: boolean;
}

interface PropertySectionProps {
  refSticky?: ReturnType<typeof useMergedRefs<HTMLElement>> | ((node: HTMLElement | null) => void);
  isSticky?: boolean;
  section: 'props' | 'state' | 'context';
}

interface EditableValueProps {
  value: unknown;
  onSave: (newValue: unknown) => void;
  onCancel: () => void;
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
  const { updates, currentIndex } = timelineState.value;
  const currentUpdate = updates[currentIndex];
  const fiberInfo = currentUpdate?.fiberInfo;
  const refElement = useRef<HTMLDivElement>(null);

  const currentPath = getPath(
    fiberInfo.displayName,
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
    if (!allowEditing) return false;
    if (section === 'props') return !!overrideProps && name !== 'children';
    if (section === 'state') return !!overrideHookState;
    return false;
  }, [section, overrideProps, overrideHookState, allowEditing, name]);

  const handleEdit = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
    }
  }, [canEdit]);

  const handleSave = (section: string, name: string, value: unknown) => {
    const { updates, currentIndex, latestFiber } = timelineState.value;
    const currentUpdate = updates[currentIndex];
    if (!latestFiber) return;

    const { overrideProps, overrideHookState } = getOverrideMethods();
    if (!overrideProps || !overrideHookState) return;

    if (section === 'props') {
      tryOrElse(() => {
        const currentProps = latestFiber.memoizedProps || {};
        let currentValue: unknown;
        let path: string[];

        if (parentPath) {
          const parts = parentPath.split('.');
          path = parts.filter(
            (part) => part !== 'props' && part !== getDisplayName(latestFiber.type),
          );
          path.push(name);
          currentValue = path.reduce((obj: Record<string, unknown>, key) =>
            obj && typeof obj === 'object' ? (obj[key] as Record<string, unknown>) : {},
            currentProps as Record<string, unknown>
          );
        } else {
          path = [name];
          currentValue = currentProps[name];
        }

        if (!isEqual(currentValue, value)) {
          overrideProps(latestFiber, path, value);

          // @pivanov: on first render, the alternate is null and we can't update it
          if (latestFiber.alternate) {
            overrideProps(latestFiber.alternate, path, value);
          }
        }
      }, null);
    } else if (section === 'state') {
      tryOrElse(() => {
        if (!parentPath) {
          const stateNames = currentUpdate.stateNames;
          const namedStateIndex = stateNames.indexOf(name);
          const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : name;
          overrideHookState(latestFiber, hookId, [], value);
        } else {
          const fullPathParts = parentPath.split('.');
          const stateIndex = fullPathParts.indexOf('state');
          if (stateIndex === -1) return;

          const statePath = fullPathParts.slice(stateIndex + 1);
          const baseStateKey = statePath[0];
          const stateNames = currentUpdate.stateNames;
          const namedStateIndex = stateNames.indexOf(baseStateKey);
          const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';

          const currentState = currentUpdate.state.current;
          if (!currentState || !currentState.find(item => item.name === Number(baseStateKey))) {
            return;
          }

          const updatedState = updateNestedValue(
            currentState.find(item => item.name === Number(baseStateKey))?.value,
            statePath.slice(1).concat(name),
            value,
          );
          overrideHookState(latestFiber, hookId, [], updatedState);
        }
      }, null);
    }

    setIsEditing(false);
  };

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
          <div className="react-scan-key">{name}:</div>
          {isEditing && isEditableValue(value, parentPath) ? (
            <EditableValue
              value={value}
              onSave={(newValue) => handleSave(section, name, newValue)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <button type="button" className="truncate" onClick={handleEdit}>
              {valuePreview}
            </button>
          )}
          <CopyToClipboard
            text={clipboardText}
            className="opacity-0 transition-opacity group-hover:opacity-100"
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

export const PropertySection = ({
  refSticky,
  isSticky,
  section,
}: PropertySectionProps) => {
  const refStickyElement = useRef<HTMLElement | null>(null);
  const refSection = useRef<HTMLDivElement>(null);
  const { updates, currentIndex } = timelineState.value;
  const [isExpanded, setIsExpanded] = useState(true);

  const refs = useMergedRefs(refStickyElement, refSticky);

  const pathMap = useMemo(() => new WeakMap<object, Set<string>>(), []);
  const { currentData, changedKeys } = useMemo(() => {
    const data = updates[currentIndex] ?? {
      props: { current: {}, changes: new Set() },
      state: { current: {}, changes: new Set() },
      context: { current: {}, changes: new Set() },
    };

    switch (section) {
      case 'props':
        return {
          currentData: data.props.current,
          changedKeys: data.props.changes,
        };
      case 'state':
        return {
          currentData: data.state.current,
          changedKeys: data.state.changes,
        };
      case 'context':
        return {
          currentData: data.context.current,
          changedKeys: data.context.changes,
        };
      default:
        return {
          currentData: {},
          changedKeys: new Set<string>(),
        };
    }
  }, [section, currentIndex, updates]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(state => {
      if (isSticky && isExpanded) {
        return state;
      }
      return !state;
    });
  }, [isExpanded, isSticky]);

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
    <>
      <button
        ref={refs}
        type="button"
        onClick={toggleExpanded}
        data-sticky
        className="react-section-header"
      >
        <div className="w-4 h-4 flex items-center justify-center">
          <Icon
            name="icon-chevron-right"
            size={12}
            className={cn(
              {
                'rotate-90': isExpanded,
                'rotate-0': isSticky && isExpanded,
              },
            )}
          />
        </div>
        <span className="capitalize">
          {section} {!isExpanded && propertyCount > 0 && `(${propertyCount})`}
        </span>
      </button>
      <div ref={refSection} className="react-scan-section">
        <div
          className={cn(
            'react-scan-expandable',
            {
              'react-scan-expanded py-0.5': isExpanded,
            },
          )}
        >
          <div className="overflow-hidden">
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
    </>
  );
};
