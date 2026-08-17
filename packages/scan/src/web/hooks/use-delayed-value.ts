import { createEffect, createSignal, onCleanup, untrack, type Accessor } from "solid-js";

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
export const createDelayedValue = (
  value: Accessor<boolean>,
  onDelay: number,
  offDelay = onDelay,
): Accessor<boolean> => {
  const [delayedValue, setDelayedValue] = createSignal(value());

  createEffect(() => {
    const nextValue = value();
    if (nextValue === untrack(delayedValue)) return;

    const delay = nextValue ? onDelay : offDelay;
    const timeoutId = setTimeout(() => setDelayedValue(nextValue), delay);
    onCleanup(() => clearTimeout(timeoutId));
  });

  return delayedValue;
};
