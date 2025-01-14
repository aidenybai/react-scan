import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import {
  type InspectableElement,
  getInspectableElements,
} from '~web/components/inspector/utils';
import { useDelayedValue } from '~web/hooks/use-mount-delay';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';

export const Arrows = constant(() => {
  const refButtonPrevious = useRef<HTMLButtonElement>(null);
  const refButtonNext = useRef<HTMLButtonElement>(null);
  const refAllElements = useRef<Array<InspectableElement>>([]);

  const [shouldRender, setShouldRender] = useState(false);
  const isMounted = useDelayedValue(shouldRender, 0, 1000);

  const findNextElement = useCallback(
    (currentElement: HTMLElement, direction: 'next' | 'previous') => {
      const currentIndex = refAllElements.current.findIndex(
        (item) => item.element === currentElement,
      );
      if (currentIndex === -1) return null;

      const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);
      return refAllElements.current[nextIndex]?.element || null;
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const onPreviousFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const prevElement = findNextElement(
      currentState.focusedDomElement,
      'previous',
    );
    if (prevElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: prevElement,
      };
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const onNextFocus = useCallback(() => {
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused' || !currentState.focusedDomElement)
      return;

    const nextElement = findNextElement(currentState.focusedDomElement, 'next');
    if (nextElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: nextElement,
      };
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    const unsubscribe = Store.inspectState.subscribe((state) => {
      if (state.kind === 'focused' && refButtonPrevious.current && refButtonNext.current) {
        refAllElements.current = getInspectableElements();

        const hasPrevious = !!findNextElement(
          state.focusedDomElement,
          'previous',
        );
        refButtonPrevious.current.classList.toggle(
          'opacity-50',
          !hasPrevious,
        );
        refButtonPrevious.current.classList.toggle(
          'cursor-not-allowed',
          !hasPrevious,
        );

        const hasNext = !!findNextElement(state.focusedDomElement, 'next');
        refButtonNext.current.classList.toggle(
          'opacity-50',
          !hasNext,
        );
        refButtonNext.current.classList.toggle(
          'cursor-not-allowed',
          !hasNext,
        );

        setShouldRender(true);
      }

      if (state.kind === 'inspecting' && refButtonPrevious.current && refButtonNext.current) {
        refButtonPrevious.current.classList.toggle(
          'opacity-50',
          true,
        );
        refButtonPrevious.current.classList.toggle(
          'cursor-not-allowed',
          true,
        );
        refButtonNext.current.classList.toggle(
          'opacity-50',
          true,
        );
        refButtonNext.current.classList.toggle(
          'cursor-not-allowed',
          true,
        );
        setShouldRender(true);
      }

      if (state.kind === 'inspect-off') {
        refAllElements.current = [];
        setShouldRender(false);
      }

      if (state.kind === 'uninitialized') {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-stretch justify-between',
        'ml-auto',
        'text-[#999]',
        'overflow-hidden',
        'transition-opacity duration-300',
        {
          'opacity-0 w-0': !isMounted,
        }
      )}
    >
      <button
        type="button"
        ref={refButtonPrevious}
        title="Previous element"
        onClick={onPreviousFocus}
        className={cn(
          'button',
          'flex items-center justify-center',
          'px-3',
          'opacity-50',
          'transition-all duration-300',
          'cursor-not-allowed',
        )}
      >
        <Icon name="icon-previous" />
      </button>
      <button
        type="button"
        ref={refButtonNext}
        title="Next element"
        onClick={onNextFocus}
        className={cn(
          'button',
          'flex items-center justify-center',
          'px-3',
          'opacity-50',
          'transition-all duration-300',
          'cursor-not-allowed',
        )}
      >
        <Icon name="icon-next" />
      </button>
    </div>
  );
});
