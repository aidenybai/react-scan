import { useCallback, useEffect, useRef } from "preact/hooks";
import { cn } from "~web/utils/helpers";

interface SliderProps {
  className?: string;
  onChange: (e: Event) => void;
  value: number;
  min: number;
  max: number;
  totalUpdates?: number;
}

export const Slider = ({
  value,
  min,
  max,
  onChange,
  className,
  totalUpdates = max + 1,
}: SliderProps) => {
  const refThumb = useRef<HTMLSpanElement>(null);
  const refLastValue = useRef<number>(value);

  const updateThumbPosition = useCallback((value: number) => {
    if (!refThumb.current) return;

    const range = Math.max(1, max - min);
    const valueOffset = value - min;
    const percentage = min === max ? 0 : Math.min(100, Math.round((valueOffset / range) * 100));

    refThumb.current.style.setProperty('left', `${percentage}%`);
  }, [min, max]);

  /**
   * biome-ignore lint/correctness/useExhaustiveDependencies:
   * we rely on min, max and value to update the thumb position
   */
  useEffect(() => {
    updateThumbPosition(value);
  }, [min, max, value]);

  const handleChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = Number.parseInt(target.value, 10);

    if (newValue >= totalUpdates) {
      return;
    }

    if (refLastValue.current !== newValue) {
      refLastValue.current = newValue;
      updateThumbPosition(newValue);
      onChange(e);
    }
  }, [onChange, updateThumbPosition, totalUpdates]);

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      className={cn(
        'react-scan-slider relative',
        'flex-1',
        className
      )}
    >
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
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
      <div
        className={cn(
          'absolute inset-0 right-2',
          'pointer-events-none',
        )}
      >
        <span ref={refThumb} />
      </div>
    </div>
  );
};
