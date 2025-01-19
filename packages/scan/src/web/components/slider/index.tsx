import { useCallback, useEffect, useRef } from "preact/hooks";
import { cn } from "~web/utils/helpers";

interface SliderProps {
  className?: string;
  onChange: (e: Event) => void;
  value: number;
  min: number;
  max: number;
  showThumb?: boolean;
}

export const Slider = ({
  value,
  min,
  max,
  onChange,
  className,
  showThumb = true,
}: SliderProps) => {
  const refInput = useRef<HTMLInputElement>(null);
  const refThumb = useRef<HTMLSpanElement>(null);

  const calculateThumbPosition = useCallback((value: number, min: number, max: number) => {
    if (!refInput.current || !refThumb.current) return 0;

    const inputWidth = refInput.current.offsetWidth;
    const thumbWidth = refThumb.current.offsetWidth;
    const range = Math.max(1, max - min);
    const valueOffset = value - min;
    const percentage = range <= 1 ? (value === max ? 1 : 0) : valueOffset / range;
    const maxPosition = inputWidth - thumbWidth;

    return Math.max(0, Math.min(percentage * maxPosition, maxPosition));
  }, []);

  const updateThumbPosition = useCallback(() => {
    if (!refThumb.current) return;
    const pixels = calculateThumbPosition(value, min, max);
    refThumb.current.style.setProperty('left', `${pixels}px`);
  }, [calculateThumbPosition, value, min, max]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    updateThumbPosition();
  }, []);

  return (
    <div className={cn('react-scan-slider relative', className)}>
      <input
        ref={refInput}
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        className={cn(
          'react-scan-slider',
          'flex-1',
          'h-1.5',
          'bg-gray-200',
          'rounded-lg',
          'appearance-none',
          'cursor-pointer',
          className
        )}
      />
      <span
        ref={refThumb}
        className={cn(
          'absolute top-1/2 -translate-y-1/2',
          'w-3 h-3',
          'rounded-full',
          'bg-green-500',
          'opacity-0',
          'transition-opacity duration-150 ease',
          {
            'opacity-100': showThumb,
          }
        )}
      />
    </div>
  );
};
