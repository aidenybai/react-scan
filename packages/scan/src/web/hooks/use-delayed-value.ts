import { useEffect, useState } from 'preact/hooks';

/**
 * Delays a boolean value change by a specified duration.
 * Perfect for coordinating animations with state changes.
 *
 * @param {boolean} value - The boolean value to delay
 * @param {number} onDelay - Milliseconds to wait before changing to true
 * @param {number} [offDelay] - Milliseconds to wait before changing to false (defaults to onDelay)
 * @returns {boolean} The delayed value
 *
 * @example
 * // Delay both transitions by 300ms
 * const isVisible = useDelayedValue(show, 300);
 *
 * @example
 * // Quick show (100ms), slow hide (500ms)
 * const isVisible = useDelayedValue(show, 100, 500);
 *
 * @example
 * // Use with CSS transitions
 * const isVisible = useDelayedValue(show, 300);
 * return (
 *   <div
 *     className="transition-all duration-300"
 *     style={{
 *       opacity: isVisible ? 1 : 0,
 *       transform: isVisible ? 'none' : 'translateY(4px)'
 *     }}
 *   >
 *     {content}
 *   </div>
 * );
 */
export const useDelayedValue = (
  value: boolean,
  onDelay: number,
  offDelay: number = onDelay,
): boolean => {
  const [delayedValue, setDelayedValue] = useState(value);

  /*
   * biome-ignore lint/correctness/useExhaustiveDependencies:
   * delayedValue is intentionally omitted to prevent unnecessary timeouts
   * and used only in the early return check
   */
  useEffect(() => {
    if (value === delayedValue) return;

    const delay = value ? onDelay : offDelay;
    const timeout = setTimeout(() => setDelayedValue(value), delay);

    return () => clearTimeout(timeout);
  }, [value, onDelay, offDelay]);

  return delayedValue;
};
