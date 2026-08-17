import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

export interface VirtualItem {
  key: number;
  index: number;
  start: number;
}

interface VirtualListOptions {
  count: () => number;
  getScrollElement: () => HTMLElement | undefined;
  estimateSize: () => number;
  overscan: number;
}

export const createVirtualList = (options: VirtualListOptions) => {
  const [scrollTop, setScrollTop] = createSignal(0);
  const [containerHeight, setContainerHeight] = createSignal(0);
  const itemHeight = options.estimateSize();
  const itemCache = new Map<number, VirtualItem>();
  let animationFrameId: number | undefined;

  onMount(() => {
    const scrollElement = options.getScrollElement();
    if (!scrollElement) return;

    const updateContainerHeight = () => {
      setContainerHeight(scrollElement.getBoundingClientRect().height);
    };
    const scheduleContainerHeightUpdate = () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        updateContainerHeight();
        animationFrameId = undefined;
      });
    };
    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop);
    };

    updateContainerHeight();

    const resizeObserver = new ResizeObserver(scheduleContainerHeightUpdate);
    resizeObserver.observe(scrollElement);
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    const mutationObserver = new MutationObserver(scheduleContainerHeightUpdate);
    mutationObserver.observe(scrollElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    onCleanup(() => {
      scrollElement.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  });

  const visibleRange = createMemo(() => {
    const start = Math.floor(scrollTop() / itemHeight);
    const visibleCount = Math.ceil(containerHeight() / itemHeight);

    return {
      start: Math.max(0, start - options.overscan),
      end: Math.min(options.count(), start + visibleCount + options.overscan),
    };
  });

  const virtualItems = createMemo(() => {
    const items: VirtualItem[] = [];
    const range = visibleRange();
    for (let index = range.start; index < range.end; index++) {
      let item = itemCache.get(index);
      if (!item) {
        item = {
          key: index,
          index,
          start: index * itemHeight,
        };
        itemCache.set(index, item);
      }
      items.push(item);
    }
    return items;
  });

  return {
    virtualItems,
    totalSize: () => options.count() * itemHeight,
  };
};
