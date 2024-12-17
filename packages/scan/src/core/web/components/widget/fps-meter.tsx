import { useEffect, useRef } from 'preact/hooks';
import { cn, toggleMultipleClasses } from '@web-utils/helpers';
import { getFPS } from '../../../instrumentation';

export const FpsMeter = () => {
  const refContainer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let rafId: number;
    let lastUpdate = performance.now();
    const UPDATE_INTERVAL = 100;

    const updateFPS = () => {
      const now = performance.now();
      if (now - lastUpdate >= UPDATE_INTERVAL) {
        if (!refContainer.current) return;
        const fps = getFPS();
        refContainer.current.dataset.text = fps.toString();
        if (fps < 10) {
          toggleMultipleClasses(refContainer.current, 'text-white', 'bg-red-500', 'text-black', 'bg-yellow-300');
        } else if (fps < 30) {
          toggleMultipleClasses(refContainer.current, 'text-white', 'bg-red-500', 'text-black', 'bg-yellow-300');
        }

        lastUpdate = now;
      }
      rafId = requestAnimationFrame(updateFPS);
    };

    rafId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);


  return (
    <span
      ref={refContainer}
      data-text="120"
      className={cn(
        'with-data-text',
        'flex gap-1 items-center',
        'ml-2 px-2',
        'h-full',
        'text-white text-xs font-mono whitespace-nowrap',
        'bg-neutral-700',
        'rounded-full',
      )}
    >
      <span className="text-xxs">FPS</span>
    </span>
  );
};

export default FpsMeter;
