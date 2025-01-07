import { useDebugValue } from 'preact/hooks';
import { useLazyRef } from './use-lazy-ref';

export function useConstant<T>(supplier: () => T): T {
  const value = useLazyRef(supplier).current;
  useDebugValue(value);
  return value;
}
