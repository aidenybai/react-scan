import { getFiberId } from 'bippy';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import {
  type InspectableElement,
  getCompositeComponentFromElement,
  getInspectableElements,
} from '~web/components/inspector/utils';
import { useDelayedValue } from '~web/hooks/use-mount-delay';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { getBatchedRectMap } from '../../../../new-outlines';

type FocusedState = {
  kind: 'focused';
  focusedDomElement: Element;
};

type InspectingState = {
  kind: 'inspecting';
  hoveredDomElement: Element | null;
};

type InspectOffState = {
  kind: 'inspect-off';
};

type UninitializedState = {
  kind: 'uninitialized';
};

type States =
  | FocusedState
  | InspectingState
  | InspectOffState
  | UninitializedState;

function isFocusedState(state: States): state is FocusedState {
  return state.kind === 'focused';
}

export const Arrows = constant(() => {
  const refButtonPrevious = useRef<HTMLButtonElement | null>(null);
  const refButtonNext = useRef<HTMLButtonElement>(null);
  const refAllElements = useRef<Array<InspectableElement>>([]);
  const refCurrentFiberId = useRef<number | null>(null);

  const [shouldRender, setShouldRender] = useState(false);
  const isMounted = useDelayedValue(shouldRender, 0, 1000);

  const findNextElement = useCallback(
    async (currentElement: Element, direction: 'next' | 'previous') => {
      const currentIndex = refAllElements.current.findIndex(
        (item) => item.element === currentElement,
      );
      if (currentIndex === -1) {
        return null;
      }

      const startIndex = currentIndex + (direction === 'next' ? 1 : -1);

      const elements = refAllElements.current;
      const totalElements = elements.length;

      const BATCH_SIZE = 500;

      // this looks very convoluted, but we need to efficiently find the next
      // selectable fiber, and because there may be hundreds of components that are not
      // in viewport, or have 0 width/height in the neighboring indexes we need to search in large
      // batches to avoid latency when the user clicks the next button

      if (direction === 'next') {
        for (
          let batchStart = startIndex;
          batchStart < totalElements;
          batchStart += BATCH_SIZE
        ) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, totalElements);
          const batchElements = elements
            .slice(batchStart, batchEnd)
            .map((item) => item.element);

          if (batchElements.length === 0) continue;

          const allEntries: IntersectionObserverEntry[] = [];
          for await (const entries of getBatchedRectMap(batchElements)) {
            allEntries.push(...entries);
          }

          const entryMap = new Map(
            allEntries.map((entry) => [entry.target, entry]),
          );

          for (let i = 0; i < batchElements.length; i++) {
            const element = batchElements[i];
            if (!element) continue;

            const { parentCompositeFiber } =
              getCompositeComponentFromElement(element);
            if (!parentCompositeFiber) continue;

            const nextFiberId = getFiberId(parentCompositeFiber);
            if (nextFiberId === refCurrentFiberId.current) continue;

            const entry = entryMap.get(element);
            if (
              !entry ||
              !entry.isIntersecting ||
              entry.intersectionRect.width <= 0 ||
              entry.intersectionRect.height <= 0
            )
              continue;

            const rect = element.getBoundingClientRect();
            const isVisible =
              rect.top < window.innerHeight &&
              rect.bottom > 0 &&
              rect.left < window.innerWidth &&
              rect.right > 0;

            if (!isVisible) continue;

            refCurrentFiberId.current = nextFiberId;
            return element;
          }
        }
      } else {
        // For previous direction, process from current index to start
        for (let batchEnd = startIndex; batchEnd >= 0; batchEnd -= BATCH_SIZE) {
          const batchStart = Math.max(batchEnd - BATCH_SIZE + 1, 0);
          const batchElements = elements
            .slice(batchStart, batchEnd + 1)
            .map((item) => item.element)
            .reverse();

          if (batchElements.length === 0) continue;

          const allEntries: IntersectionObserverEntry[] = [];
          for await (const entries of getBatchedRectMap(batchElements)) {
            allEntries.push(...entries);
          }

          const entryMap = new Map(
            allEntries.map((entry) => [entry.target, entry]),
          );

          for (let i = 0; i < batchElements.length; i++) {
            const element = batchElements[i];
            if (!element) continue;

            const { parentCompositeFiber } =
              getCompositeComponentFromElement(element);
            if (!parentCompositeFiber) continue;

            const nextFiberId = getFiberId(parentCompositeFiber);
            if (nextFiberId === refCurrentFiberId.current) continue;

            const entry = entryMap.get(element);
            if (
              !entry ||
              !entry.isIntersecting ||
              entry.intersectionRect.width <= 0 ||
              entry.intersectionRect.height <= 0
            )
              continue;

            const rect = element.getBoundingClientRect();
            const isVisible =
              rect.top < window.innerHeight &&
              rect.bottom > 0 &&
              rect.left < window.innerWidth &&
              rect.right > 0;

            if (!isVisible) continue;

            refCurrentFiberId.current = nextFiberId;
            return element;
          }
        }
      }

      return null;
    },
    [],
  );

  const onPreviousFocus = useCallback(async () => {
    const currentState = Store.inspectState.value;
    if (
      !isFocusedState(currentState) ||
      !currentState.focusedDomElement ||
      refButtonPrevious.current?.disabled
    ) {
      return;
    }

    const prevElement = await findNextElement(
      currentState.focusedDomElement,
      'previous',
    );
    if (prevElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: prevElement,
      };
    }
  }, [findNextElement]);

  const onNextFocus = useCallback(async () => {
    const currentState = Store.inspectState.value;
    if (
      !isFocusedState(currentState) ||
      !currentState.focusedDomElement ||
      refButtonNext.current?.disabled
    ) {
      return;
    }

    const nextElement = await findNextElement(
      currentState.focusedDomElement,
      'next',
    );
    if (nextElement) {
      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: nextElement,
      };
    }
  }, [findNextElement]);

  useEffect(() => {
    const unsubscribe = Store.inspectState.subscribe(async (state) => {
      if (
        state.kind === 'focused' &&
        refButtonPrevious.current &&
        refButtonNext.current
      ) {
        refAllElements.current = getInspectableElements();

        const { parentCompositeFiber } = getCompositeComponentFromElement(
          state.focusedDomElement,
        );
        if (parentCompositeFiber) {
          const currentFiberId = getFiberId(parentCompositeFiber);
          refCurrentFiberId.current = currentFiberId;
        }

        const hasPrevious = !!(await findNextElement(
          state.focusedDomElement,
          'previous',
        ));
        if (!refButtonPrevious.current || !refButtonNext.current) {
          // handle the ref unmounting before the awaited code (us)
          return;
        }
        refButtonPrevious.current.disabled = !hasPrevious;
        refButtonPrevious.current.classList.toggle('opacity-50', !hasPrevious);
        refButtonPrevious.current.classList.toggle(
          'cursor-not-allowed',
          !hasPrevious,
        );

        const hasNext = !!(await findNextElement(
          state.focusedDomElement,
          'next',
        ));
        refButtonNext.current.disabled = !hasNext;
        refButtonNext.current.classList.toggle('opacity-50', !hasNext);
        refButtonNext.current.classList.toggle('cursor-not-allowed', !hasNext);

        setShouldRender(true);
      }

      if (
        state.kind === 'inspecting' &&
        refButtonPrevious.current &&
        refButtonNext.current
      ) {
        refButtonPrevious.current.disabled = true;
        refButtonPrevious.current.classList.toggle('opacity-50', true);
        refButtonPrevious.current.classList.toggle('cursor-not-allowed', true);
        refButtonNext.current.disabled = true;
        refButtonNext.current.classList.toggle('opacity-50', true);
        refButtonNext.current.classList.toggle('cursor-not-allowed', true);
        setShouldRender(true);
      }

      if (state.kind === 'inspect-off') {
        refAllElements.current = [];
        refCurrentFiberId.current = null;
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
  }, [findNextElement]);

  return (
    <div
      className={cn(
        'flex items-stretch justify-between h-full',
        'ml-auto',
        'text-[#999]',
        'overflow-hidden',
        'transition-opacity duration-300',
        {
          'opacity-0 w-0': !isMounted,
        },
      )}
    >
      <button
        type="button"
        ref={refButtonPrevious}
        title="Previous element"
        onClick={onPreviousFocus}
        className={cn(
          'button h-full',
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
          'button h-full',
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
