import { useMemo, useState } from 'preact/hooks';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import { formatForClipboard, formatValuePreview, safeGetValue } from './utils';

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
    return <span className="text-gray-500 font-italic">{error}</span>;
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
      <div>
        {
          entries.map(([key, val], i) => {
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
              <div
                key={key}
                className={cn({ 'mt-1': i > 0 })}
              >
                <div className="flex items-center gap-1">
                  {
                    canExpand && !isCircular && (
                      <button
                        type="button"
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
                        className={cn(
                          'flex items-center',
                          'p-0 mr-1',
                          'opacity-50',
                        )}
                      >
                        <Icon
                          name="icon-chevron-right"
                          size={12}
                          className={cn(
                            'transition-[transform,color]',
                            'text-[#4ade80]',
                            {
                              'transform rotate-90': isExpanded,
                              'text-[#f87171]': isNegative,
                            },
                          )}
                        />
                      </button>
                    )
                  }
                  <span className="text-gray-500">{key}:</span>
                  {
                    isCircular
                      ? (
                        <span className="text-gray-500 font-italic">
                          [Circular]
                        </span>
                      )
                      : (!canExpand || !isExpanded)
                        ? (
                          <span>
                            {formatValuePreview(val)}
                          </span>
                        ) : null
                  }
                </div>
                {
                  canExpand && isExpanded && !isCircular &&
                  renderExpandedValue(val, currentPath)
                }
              </div>
            );
          })
        }
      </div>
    );
  };

  return (
    <div className="flex items-start gap-1">
      {
        isExpandable && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'flex items-center',
              'p-0 mt-0.5 mr-1',
              'opacity-50',
            )}
          >
            <Icon
              name="icon-chevron-right"
              size={12}
              className={cn(
                'transition-[transform,color]',
                'text-[#4ade80]',
                {
                  'transform rotate-90': expanded,
                  'text-[#f87171]': isNegative,
                },
              )}
            />
          </button>
        )
      }
      <div className="flex-1">
        {!expanded ? (
          <span>{formatValuePreview(safeValue)}</span>
        ) : (
          renderExpandedValue(safeValue)
        )}
      </div>
      <CopyToClipboard
        text={formatForClipboard(safeValue)}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
      </CopyToClipboard>
    </div>
  );
};
