import { useEffect, useState } from 'preact/hooks';
import { getFPS } from '~core/instrumentation';
import { cn } from '~web/utils/helpers';

export const FpsMeter = () => {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFps(getFPS());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <span
      style={{
        width: 'fit-content',
      }}
      data-text={String(fps)}
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
