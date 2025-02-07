import { useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';

import { cn } from '~web/utils/helpers';
import { getCompositeFiberFromElement, getInspectableAncestors } from '../utils';
import { type TreeItem, signalSkipTreeUpdate } from './state';

export const Breadcrumb = ({ selectedElement }: { selectedElement: HTMLElement | null }) => {
  const refContainer = useRef<HTMLDivElement>(null);
  const refPaths = useRef<HTMLDivElement>(null);

  const [path, setPath] = useState<TreeItem[]>([]);
  const [areAllItemsVisible, setAreAllItemsVisible] = useState(true);

  useEffect(() => {
    if (!selectedElement) return;
    const ancestors = getInspectableAncestors(selectedElement);
    setPath(ancestors);
  }, [selectedElement]);

  useEffect(() => {
    let timeoutId: TTimer;
    const checkVisibility = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (refContainer.current && refPaths.current) {
          const isFullyVisible =
            refContainer.current.offsetHeight >= refPaths.current.offsetHeight;
          setAreAllItemsVisible(isFullyVisible);
        }
      }, 16);
    };

    const resizeObserver = new ResizeObserver(checkVisibility);
    if (refContainer.current && refPaths.current) {
      resizeObserver.observe(refPaths.current);
      checkVisibility();
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleElementClick = (element: HTMLElement) => {
    const { parentCompositeFiber } = getCompositeFiberFromElement(element);
    if (!parentCompositeFiber) return;

    signalSkipTreeUpdate.value = false;

    Store.inspectState.value = {
      kind: 'focused',
      focusedDomElement: element,
      fiber: parentCompositeFiber,
    };
  };

  const firstItem = path[0];
  const restItems = path.slice(1).reverse();

  return (
    <div
      ref={refContainer}
      className={cn(
        'flex items-center gap-x-1',
        'px-2',
        'text-xs text-neutral-400',
        'border-b border-white/10',
        'overflow-hidden whitespace-nowrap',
      )}
    >
      <button
        type="button"
        className="hover:text-neutral-300 transition-colors"
        onClick={() => {
          handleElementClick(firstItem.element as HTMLElement);
        }}
      >
        {firstItem?.name}
      </button>
      {!areAllItemsVisible && restItems.length > 1 ? (
        <span className="text-sm w-2.5 h-2.5 flex items-center justify-center">
          …
        </span>
      ) : (
        restItems.length > 0 && (
          <span className="w-2.5 h-2.5 flex items-center justify-center text-neutral-400">
            <Icon name="icon-chevron-right" size={10} />
          </span>
        )
      )}
      <div className="h-7 overflow-hidden">
        <div
          ref={refPaths}
          className={cn(
            'flex-1 flex flex-wrap flex-row-reverse justify-end gap-x-1',
          )}
        >
          {restItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={cn(
                'flex-1 flex items-center gap-x-1',
                'flex-[0_0_auto]',
                'h-7',
                'hover:text-neutral-300 transition-colors',
                'overflow-hidden',
              )}
            >
              <button
                type="button"
                title={item.name}
                style={{ maxWidth: '160px' }} // CSS hack to force truncation
                className="truncate"
                onClick={() => {
                  handleElementClick(item.element as HTMLElement);
                }}
              >
                {item.name}
              </button>

              {index > 0 && (
                <span className="w-2.5 h-2.5 flex items-center justify-center text-neutral-400">
                  <Icon name="icon-chevron-right" size={10} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
