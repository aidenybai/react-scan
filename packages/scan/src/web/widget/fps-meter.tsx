import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { getFPS } from '~core/instrumentation';
import { cn } from '~web/utils/helpers';

export const FpsMeter = () => {
  const fps = useSignal(120);

  useSignalEffect(() => {
    const intervalId = setInterval(() => {
      fps.value = getFPS();
    }, 100);

    return () => clearInterval(intervalId);
  });

  const style = useComputed(() => {
    let color = '#fff';
    if (fps.value < 30) color = '#f87171';
    if (fps.value < 50) color = '#fbbf24';
    return {
      color,
    };
  });

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
        data-text={fps}
        style={style}
        className="transition-color ease-in-out with-data-text"
      />
      <span className="tracking-wide font-mono text-xxs mt-[1px]">FPS</span>
    </span>
  );
};

export default FpsMeter;
