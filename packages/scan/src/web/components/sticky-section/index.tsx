import { memo } from 'preact/compat';
import { useCallback, useRef, useState } from 'preact/hooks';
import type { useMergedRefs } from '~web/hooks/use-merged-refs';

interface StickyRenderProps {
  refSticky: ReturnType<typeof useMergedRefs<HTMLElement>>;
  isSticky: boolean;
  calculateStickyTop: (removeSticky?: boolean) => void;
}

interface StickyProps {
  children: (props: StickyRenderProps) => preact.JSX.Element;
}

export const StickySection = memo(({ children }: StickyProps) => {
  const refScrollableElement = useRef<HTMLElement | null>(null);
  const refScrollAtTop = useRef(false);
  const [isSticky, setIsSticky] = useState(false);
  const refRafId = useRef(0);

  const calculateStickyTop = useCallback((removeSticky = false) => {
    const stickyElements = Array.from(
      refScrollableElement.current?.children || [],
    ) as HTMLElement[];
    if (!stickyElements.length) return;

    let cumulativeHeight = 0;

    for (const element of stickyElements) {
      const sticky = element as HTMLElement;
      if (sticky.dataset.sticky) {
        if (removeSticky) {
          sticky.style.removeProperty('top');
        } else {
          sticky.style.setProperty('top', `${cumulativeHeight}px`);
        }
        cumulativeHeight += sticky.offsetHeight;
      }
    }
  }, []);

  const refSticky = useCallback(
    (node: HTMLElement | null) => {
      if (!node) {
        requestAnimationFrame(() => {
          calculateStickyTop();
        });
        return;
      }

      refScrollableElement.current = node.parentElement;
      node.dataset.sticky = 'true';

      const handleClick = () => {
        if (!node.dataset.disableScroll) {
          refScrollableElement.current?.scrollTo({
            top: Number(node.style.top) ?? 0,
            behavior: 'smooth',
          });
        }
      };

      node.onclick = handleClick;
      calculateStickyTop();

      const handleScroll = () => {
        cancelAnimationFrame(refRafId.current);
        refRafId.current = requestAnimationFrame(() => {
          if (!node || !refScrollableElement.current) return;

          const refRect = node.getBoundingClientRect();
          const containerRect =
            refScrollableElement.current.getBoundingClientRect();

          const stickyOffset = Number.parseInt(getComputedStyle(node).top);
          refScrollAtTop.current = refScrollableElement.current.scrollTop > 0;

          const stickyActive =
            refScrollAtTop.current &&
            refRect.top <= containerRect.top + stickyOffset;

          if (stickyActive !== isSticky) {
            setIsSticky(stickyActive);
          }

          calculateStickyTop();
        });
      };

      refScrollableElement.current?.addEventListener('scroll', handleScroll, {
        passive: true,
      });
    },
    [isSticky, calculateStickyTop],
  );

  return children({
    refSticky,
    isSticky,
    calculateStickyTop,
  });
});
