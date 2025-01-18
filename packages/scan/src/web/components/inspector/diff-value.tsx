import { useMemo, useState } from 'preact/hooks';
import { formatForClipboard, formatValuePreview, safeGetValue } from './utils';
import { CopyToClipboard } from '../copy-to-clipboard';
import { Icon } from '../icon';

export const DiffValueView = ({
  value,
  expanded,
  onToggle,
  isNegative,
}: {
  value: unknown;
  expanded: boolean;
  onToggle: () => void;
  isNegative: boolean;
}) => {
  const { value: safeValue, error } = safeGetValue(value);
  const pathPrefix = useMemo(() => Math.random().toString(36).slice(2), []);
  const [expandedPaths, setExpandedPaths] = useState(new Set<string>());

  if (error) {
    return <span style={{ color: '#666', fontStyle: 'italic' }}>{error}</span>;
  }

  const isExpandable =
    safeValue !== null &&
    typeof safeValue === 'object' &&
    !(safeValue instanceof Promise);

  const renderExpandedValue = (obj: unknown, path = ''): JSX.Element => {
    if (obj === null || typeof obj !== 'object') {
      return <span>{formatValuePreview(obj)}</span>;
    }

    const entries = Object.entries(obj);
    const seenObjects = new WeakSet();

    return (
      <div style={{ paddingLeft: '12px' }}>
        {entries.map(([key, val], i) => {
          const currentPath = path ? `${path}.${key}` : key;
          const fullPath = `${pathPrefix}.${currentPath}`;
          const isExpanded = expandedPaths.has(fullPath);
          const canExpand = val !== null && typeof val === 'object';

          let isCircular = false;
          if (canExpand) {
            if (seenObjects.has(val)) {
              isCircular = true;
            } else {
              seenObjects.add(val);
            }
          }

          return (
            <div key={key} style={{ marginTop: i > 0 ? '4px' : 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {canExpand && !isCircular && (
                  <button
                    onClick={() => {
                      setExpandedPaths((prev) => {
                        const next = new Set(prev);
                        if (next.has(fullPath)) {
                          next.delete(fullPath);
                        } else {
                          next.add(fullPath);
                        }
                        return next;
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      marginTop: '2px',
                      marginRight: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      opacity: 0.5,
                    }}
                  >
                    <Icon
                      name="icon-chevron-right"
                      size={12}
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 150ms',
                        color: isNegative ? '#f87171' : '#4ade80',
                      }}
                    />
                  </button>
                )}
                <span style={{ color: '#666' }}>{key}:</span>
                {isCircular ? (
                  <span style={{ color: '#666', fontStyle: 'italic' }}>
                    [Circular]
                  </span>
                ) : !canExpand || !isExpanded ? (
                  <span>{formatValuePreview(val)}</span>
                ) : null}
              </div>
              {canExpand && isExpanded && !isCircular && (
                <div style={{ paddingLeft: '12px' }}>
                  {renderExpandedValue(val, currentPath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
      {isExpandable && (
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: '2px',
            marginRight: '1px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            opacity: 0.5,
          }}
        >
          <Icon
            name="icon-chevron-right"
            size={12}
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 150ms',
              color: isNegative ? '#f87171' : '#4ade80',
            }}
          />
        </button>
      )}
      <div style={{ flex: 1 }}>
        {!expanded ? (
          <span>{formatValuePreview(safeValue)}</span>
        ) : (
          renderExpandedValue(safeValue)
        )}
      </div>
      <CopyToClipboard
        text={formatForClipboard(safeValue)}
        className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
      </CopyToClipboard>
    </div>
  );
};
