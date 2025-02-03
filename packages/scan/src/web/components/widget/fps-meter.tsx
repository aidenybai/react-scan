import { useEffect, useRef } from 'preact/hooks';
import { getFPS } from '~core/instrumentation';
import { cn } from '~web/utils/helpers';

export const FpsMeter = () => {
  const refFps = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const fps = getFPS();
      let color = '#fff';
      if (fps) {
        if (fps < 30) color = '#f87171';
        if (fps < 50) color = '#fbbf24';
      }
      if (refFps.current) {
        refFps.current.setAttribute('data-text', fps.toString());
        refFps.current.style.color = color;
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <span
      className={cn(
        'flex items-center gap-x-1 px-1.5',
        'h-full',
        'rounded-xl',
        'font-mono text-xs font-medium',
        'bg-neutral-600',
      )}
    >
      <span
        ref={refFps}
        data-text="120"
        className="transition-color ease-in-out with-data-text"
      />
      <span className="tracking-wide font-mono text-xxs mt-[1px]">
        FPS
      </span>
    </span>
  );
};

export default FpsMeter;
