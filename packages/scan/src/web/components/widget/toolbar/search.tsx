// TODO: @pivanov - improve UI and finish the implementation
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { Store } from '~core/index';
import { getInspectableElements } from '~web/components/inspector/utils';
import { cn } from '~web/utils/helpers';

export const Search = () => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const refInput = useRef<HTMLInputElement>(null);
  const refList = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const handleSelect = useCallback((element: HTMLElement) => {
    Store.inspectState.value = {
      kind: 'focused',
      focusedDomElement: element,
    };

    handleClose();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const elements = useMemo(() => getInspectableElements(), []);

  const currentElement =
    Store.inspectState.value.kind === 'focused'
      ? Store.inspectState.value.focusedDomElement
      : null;

  const filteredElements = useMemo(() => {
    if (!search) return elements;
    const searchLower = search.toLowerCase();
    return elements.filter((item) =>
      item.name.toLowerCase().includes(searchLower),
    );
  }, [elements, search]);

  useEffect(() => {
    if (isOpen) {
      refInput.current?.focus();

      if (currentElement) {
        const index = filteredElements.findIndex(
          (item) => item.element === currentElement,
        );
        if (index !== -1) {
          setSelectedIndex(index);
          requestAnimationFrame(() => {
            const itemElement = refList.current?.children[index] as HTMLElement;
            if (itemElement) {
              itemElement.scrollIntoView({ block: 'center' });
            }
          });
        }
      }
    }
  }, [isOpen, currentElement, filteredElements]);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => (i < filteredElements.length - 1 ? i + 1 : i));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : i));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredElements[selectedIndex]) {
          handleSelect(filteredElements[selectedIndex].element);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 top-full z-50 mt-1 rounded border border-white/10 bg-[#1e1e1e] shadow-lg">
      <input
        ref={refInput}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setSelectedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className="h-9 w-full border-b border-white/10 bg-transparent px-2 py-1 text-white focus:outline-none"
        placeholder="Search components..."
      />
      <div
        ref={refList}
        className="fixed inset-0 max-h-[calc(100%_-_36px)] overflow-y-auto bg-slate-700 p-2"
      >
        {
          filteredElements.map((item, index) => (
            <button
              type="button"
              key={`${item.name}-${item.depth}-${index}`}
              onClick={() => {
                handleSelect(item.element);
              }}
              className={cn(
                'flex items-center px-2 py-1 cursor-pointer hover:bg-white/5',
                selectedIndex === index && 'bg-white/10',
              )}
              style={{
                paddingLeft: `${item.depth * 16 + 8}px`,
              }}
            >
              <span className="truncate">
                {item.depth > 0 && '└─ '}
                {item.name}
              </span>
            </button>
          ))
        }
      </div>
    </div>
  );
};
