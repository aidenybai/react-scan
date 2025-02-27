import type { Ref, RefCallback } from 'preact';
import type { MutableRefObject } from 'preact/compat';
import { useMemo } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

const assignRef = <T>(ref: PossibleRef<T>, value: T) => {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null) {
    (ref as MutableRefObject<T>).current = value;
  }
};

function assignRefs<T>(this: PossibleRef<T>[], node: T | null) {
  if (node) {
    for (const ref of this) {
      if (ref) {
        assignRef(ref, node);
      }
    }
  }
}

function mergeRefs<T>(this: PossibleRef<T>[]): RefCallback<T> {
  return (assignRefs<T>).bind(this);
}

export const useMergedRefs = <T>(...refs: PossibleRef<T>[]): RefCallback<T> => {
  return useMemo((mergeRefs<T>).bind(refs), refs);
};
