/**
 * Safely stringifies any value, handling circular references and special types
 */
export function safeStringify(value: unknown): string {
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    (_key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      if (value instanceof Error) {
        return `[Error: ${value.message}]`;
      }
      if (value instanceof RegExp) {
        return value.toString();
      }
      if (value instanceof Map) {
        return `Map(${value.size})`;
      }
      if (value instanceof Set) {
        return `Set(${value.size})`;
      }
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    2,
  );
}
