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

  const fpsColor = useComputed(() => {
    const current = fps.value;
    if (current >= 50) {
      return '#fff';
    }
    if (current >= 30) {
      return '#fbbf24';
    }
    return '#f87171';
  });

  const style = useComputed(() => ({
    color: fpsColor.value,
  }));

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
        className="transition-color ease-in-out with-data-text"
        style={style}
      />
      <span className="tracking-wide font-mono text-xxs mt-[1px]">FPS</span>
    </span>
  );
};

export default FpsMeter;
